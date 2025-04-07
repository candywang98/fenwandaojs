/**
 * 时间管理模块
 * 提供与大麦网时间同步及时间格式转换的功能
 */

// 配置参数
var CONFIG = {
    ENABLE_AUTO_SYNC: false,    // 模块加载时是否自动同步时间
    SYNC_INTERVAL: 300000,      // 同步间隔时间（毫秒）
    HTTP_TIMEOUT: 5000,         // HTTP请求超时时间（毫秒）
    TIME_APIs: [                // 时间服务API列表（按优先级排序）
        {
            url: "https://mtop.damai.cn/gw/mtop.common.getTimestamp/",
            headers: {
                'Host': 'mtop.damai.cn',
                'Content-Type': 'application/json;charset=utf-8',
                'Accept': '*/*',
                'User-Agent': 'floattime/1.1.1 (iPhone; iOS 15.6; Scale/3.00)',
                'Accept-Language': 'zh-Hans-CN;q=1, en-CN;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive'
            },
            parse: function(response) {
                var data = JSON.parse(response);
                if (!data.data || !data.data.t) {
                    throw new Error('无效的大麦网时间戳响应');
                }
                return Number(data.data.t);
            }
        },
        {
            url: "https://api.m.taobao.com/rest/api3.do?api=mtop.common.getTimestamp",
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_6 like Mac OS X)'
            },
            parse: function(response) {
                var data = JSON.parse(response);
                if (!data.data || !data.data.t) {
                    throw new Error('无效的淘宝时间戳响应');
                }
                return Number(data.data.t);
            }
        }
    ]
};

// 缓存最后一次时间同步的信息
var _lastSyncInfo = {
    localTime: 0,      // 本地时间戳
    serverTime: 0,     // 服务器时间戳
    offset: 0,         // 时间差值
    lastSyncAt: 0      // 上次同步时间
};

// 检查模块是否已初始化
var _initialized = false;

/**
 * 从多个时间服务API获取服务器时间戳
 * @returns {number} 返回服务器时间戳
 * @throws {Error} 当所有API都失败时抛出错误
 */
function getServerTimestamp() {
    var errors = [];
    
    // 尝试所有配置的API
    for (var i = 0; i < CONFIG.TIME_APIs.length; i++) {
        var api = CONFIG.TIME_APIs[i];
        try {
            // 设置超时选项
            var options = {
                headers: api.headers || {},
                timeout: CONFIG.HTTP_TIMEOUT
            };
            
            var response = http.get(api.url, options);
            var responseText = response.body.string();
            return api.parse(responseText);
        } catch (error) {
            errors.push({api: api.url, error: error.message});
            console.warn('API请求失败 (' + api.url + '): ' + error.message);
            // 继续尝试下一个API
        }
    }
    
    // 所有API都失败
    var errorMsg = '所有时间服务API都请求失败: ' + JSON.stringify(errors);
    console.error(errorMsg);
    throw new Error(errorMsg);
}

/**
 * 从大麦网API获取服务器时间戳 (兼容旧版本)
 * @returns {number} 返回大麦网服务器时间戳
 * @throws {Error} 当网络请求失败时抛出错误
 */
function getDamaiTimestamp() {
    return getServerTimestamp();
}

/**
 * 尝试安全地获取服务器时间戳，如果失败则返回本地时间
 * @returns {number} 时间戳（毫秒）
 */
function safeGetServerTimestamp() {
    try {
        return getServerTimestamp();
    } catch (error) {
        console.warn('获取服务器时间戳失败，使用本地时间代替');
        return Date.now();
    }
}

/**
 * 尝试安全地获取大麦网时间戳，如果失败则返回本地时间 (兼容旧版本)
 * @returns {number} 时间戳（毫秒）
 */
function safeGetDamaiTimestamp() {
    return safeGetServerTimestamp();
}

/**
 * 同步本地时间与服务器时间
 * @returns {Object} 返回同步信息，包含本地时间、服务器时间和偏移量
 */
function syncWithServerTime() {
    try {
        var localTimeBeforeRequest = Date.now();
        var serverTime = getServerTimestamp();
        var localTimeAfterRequest = Date.now();
        
        // 计算网络延迟并调整服务器时间
        var networkDelay = (localTimeAfterRequest - localTimeBeforeRequest) / 2;
        var adjustedServerTime = serverTime + networkDelay;
        
        // 计算本地时间与服务器时间的偏移量
        var offset = adjustedServerTime - localTimeAfterRequest;
        
        // 更新缓存
        _lastSyncInfo = {
            localTime: localTimeAfterRequest,
            serverTime: adjustedServerTime,
            offset: offset,
            lastSyncAt: Date.now()
        };
        
        console.log('时间同步成功，偏移量: ' + offset + 'ms');
        
        return {
            localTime: localTimeAfterRequest,
            serverTime: adjustedServerTime,
            offset: offset
        };
    } catch (error) {
        console.warn('同步服务器时间失败，将继续使用本地时间: ' + error.message);
        return {
            localTime: Date.now(),
            serverTime: Date.now(),
            offset: 0
        };
    }
}

/**
 * 同步本地时间与大麦网服务器时间 (兼容旧版本)
 * @returns {Object} 返回同步信息，包含本地时间、服务器时间和偏移量
 */
function syncWithDamaiTime() {
    return syncWithServerTime();
}

/**
 * 获取当前的服务器校准时间（考虑偏移量）
 * @param {boolean} forceSync 是否强制与服务器同步时间，默认为false
 * @returns {number} 当前的服务器校准时间戳
 */
function getCurrentServerTime(forceSync) {
    forceSync = forceSync || false;
    try {
        // 如果从未同步或强制同步，则同步时间
        if (forceSync || _lastSyncInfo.lastSyncAt === 0 || 
            Date.now() - _lastSyncInfo.lastSyncAt > CONFIG.SYNC_INTERVAL) {
            syncWithServerTime();
        }
        
        // 返回当前时间 + 偏移量
        return Date.now() + _lastSyncInfo.offset;
    } catch (error) {
        console.warn('获取当前服务器时间失败，返回本地时间: ' + error.message);
        return Date.now();
    }
}

/**
 * 获取当前的大麦网时间（考虑偏移量）(兼容旧版本)
 * @param {boolean} forceSync 是否强制与服务器同步时间，默认为false
 * @returns {number} 当前的大麦网时间戳
 */
function getCurrentDamaiTime(forceSync) {
    return getCurrentServerTime(forceSync);
}

/**
 * 将时间戳转换为ISO 8601格式的北京时间
 * @param {number} timestamp 时间戳（毫秒）
 * @returns {string} ISO 8601格式的北京时间字符串
 */
function convertToTime(timestamp) {
    var date = new Date(Number(timestamp));
    var year = date.getUTCFullYear();
    var month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
    var day = date.getUTCDate().toString().padStart(2, "0");
    var hours = (date.getUTCHours() + 8).toString().padStart(2, "0"); // 北京时间 UTC+8
    var minutes = date.getUTCMinutes().toString().padStart(2, "0");
    var seconds = date.getUTCSeconds().toString().padStart(2, "0");
    var milliseconds = date.getUTCMilliseconds().toString().padStart(3, "0");
    
    var iso8601 = year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds + "." + milliseconds;
    return iso8601;
}

/**
 * 将时间戳转换为友好的显示格式
 * @param {number} timestamp 时间戳（毫秒）
 * @returns {string} 友好格式的时间字符串
 */
function formatTimeForDisplay(timestamp) {
    var date = new Date(Number(timestamp));
    var year = date.getUTCFullYear();
    var month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
    var day = date.getUTCDate().toString().padStart(2, "0");
    var hours = (date.getUTCHours() + 8).toString().padStart(2, "0"); // 北京时间 UTC+8
    var minutes = date.getUTCMinutes().toString().padStart(2, "0");
    var seconds = date.getUTCSeconds().toString().padStart(2, "0");
    
    return year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds;
}

/**
 * 计算两个时间戳之间的差异
 * @param {number} timestamp1 第一个时间戳
 * @param {number} timestamp2 第二个时间戳
 * @returns {Object} 返回一个包含天、小时、分钟、秒和毫秒差异的对象
 */
function calculateTimeDifference(timestamp1, timestamp2) {
    var diff = Math.abs(timestamp2 - timestamp1); // 毫秒差
    
    var days = Math.floor(diff / (24 * 60 * 60 * 1000));
    diff %= (24 * 60 * 60 * 1000);
    
    var hours = Math.floor(diff / (60 * 60 * 1000));
    diff %= (60 * 60 * 1000);
    
    var minutes = Math.floor(diff / (60 * 1000));
    diff %= (60 * 1000);
    
    var seconds = Math.floor(diff / 1000);
    var milliseconds = diff % 1000;
    
    return {
        days: days,
        hours: hours,
        minutes: minutes,
        seconds: seconds,
        milliseconds: milliseconds,
        totalMilliseconds: Math.abs(timestamp2 - timestamp1)
    };
}

/**
 * 解析时间字符串为时间戳
 * @param {string} timeStr 时间字符串，格式：MM-DD HH:mm:ss 或 MM-DD HH:mm
 * @returns {number} 对应的时间戳（毫秒）
 */
function parseTimeString(timeStr) {
    try {
        // 处理格式: MM-DD HH:mm:ss 或 MM-DD HH:mm
        var parts = timeStr.split(' ');
        var dateParts = parts[0].split('-');
        var timeParts = parts[1].split(':');
        
        var now = new Date();
        var year = now.getFullYear();
        var month = parseInt(dateParts[0]) - 1; // 月份从0开始
        var day = parseInt(dateParts[1]);
        var hour = parseInt(timeParts[0]);
        var minute = parseInt(timeParts[1]);
        var second = timeParts.length > 2 ? parseInt(timeParts[2]) : 0;
        
        return new Date(year, month, day, hour, minute, second).getTime();
    } catch (e) {
        console.error("解析时间字符串失败: " + e.message);
        return Date.now(); // 发生错误时返回当前时间
    }
}

/**
 * 初始化时间管理模块
 */
function initTimeManager() {
    // 防止重复初始化
    if (_initialized) {
        return;
    }
    
    // 设置模块已初始化标志
    _initialized = true;
    
    // 如果配置为自动同步，则进行时间同步
    if (CONFIG.ENABLE_AUTO_SYNC) {
        try {
            syncWithServerTime();
            console.log('时间模块初始化完成并已自动同步时间');
        } catch (error) {
            console.warn('时间自动同步失败: ' + error.message);
        }
    } else {
        console.log('时间模块初始化完成（未进行自动同步）');
    }
}

// 导出新API
global.getServerTimestamp = getServerTimestamp;
global.safeGetServerTimestamp = safeGetServerTimestamp;
global.syncWithServerTime = syncWithServerTime;
global.getCurrentServerTime = getCurrentServerTime;

// 兼容旧API
global.getDamaiTimestamp = getDamaiTimestamp;
global.safeGetDamaiTimestamp = safeGetDamaiTimestamp;
global.syncWithDamaiTime = syncWithDamaiTime;
global.getCurrentDamaiTime = getCurrentDamaiTime;

// 通用API
global.convertToTime = convertToTime;
global.formatTimeForDisplay = formatTimeForDisplay;
global.calculateTimeDifference = calculateTimeDifference;
global.parseTimeString = parseTimeString;

// 初始化模块
initTimeManager();

// 输出模块加载成功消息
console.log("时间管理模块加载成功");