"ui";
"auto";

/**
 * 纷玩岛抢票助手
 * 合并版本，包含所有核心功能
 */

// 配置参数
const CONFIG = {
    // 时间配置
    ENABLE_AUTO_SYNC: true,
    SYNC_INTERVAL: 300000,
    HTTP_TIMEOUT: 5000,
    TIME_APIs: [
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
        }
    ],
    // 点击配置
    CLICK_CONFIG: {
        MAX_ATTEMPTS: 1000,
        CLICK_INTERVAL: 1,
        REFRESH_INTERVAL: 1000
    }
};

// 创建UI界面
ui.layout(
    <vertical padding="16">
        <text id="title" textSize="24sp" textColor="#11ee00" textStyle="bold" gravity="center" margin="0 0 0 10">纷玩岛抢票助手</text>
        <horizontal margin="0 20 0 0">
            <text textSize="16sp" layout_gravity="center">抢票时间: </text>
            <input id="timeInput" hint="格式: MM-DD HH:mm" textSize="16sp" layout_weight="1" text="04-21 16:18" visibility="gone"/>
            <button id="setTimeBtn" text="设置" style="Widget.AppCompat.Button.Colored" layout_gravity="center" visibility="gone"/>
        </horizontal>
        <button id="showTimePickerBtn" text="选择抢票时间" style="Widget.AppCompat.Button.Colored" layout_gravity="center" margin="0 0 10 0"/>
        <text id="selectedTimeText" text="未选择时间" textSize="16sp" gravity="center" margin="0 0 10 0"/>
        <horizontal margin="0 10 0 0">
            <text textSize="16sp" layout_gravity="center">票价选择: </text>
            <spinner id="priceSpinner" entries="980元|680元|480元|1280元|任意可用票价" textSize="16sp" layout_weight="1"/>
        </horizontal>
        <horizontal margin="0 10 0 0">
            <text textSize="16sp" layout_gravity="center">状态: </text>
            <text id="statusText" text="等待开始" textSize="16sp" textColor="#ff7f00" layout_weight="1"/>
        </horizontal>
        <horizontal margin="0 20 0 0">
            <button id="startBtn" text="开始抢票" style="Widget.AppCompat.Button.Colored" layout_weight="1"/>
            <button id="stopBtn" text="停止" style="Widget.AppCompat.Button.Borderless.Colored" layout_weight="1"/>
        </horizontal>
        <horizontal margin="0 20 0 0">
            <button id="launchAppBtn" text="启动纷玩岛" style="Widget.AppCompat.Button.Colored" layout_weight="1"/>
        </horizontal>
        <text textSize="12sp" margin="0 20 0 0" textColor="#888888">说明: 请提前打开商品详情页，设置好抢票时间后点击开始</text>
        <text textSize="12sp" margin="0 5 0 0" textColor="#888888">注意: 本工具仅供学习交流，请勿用于商业用途</text>
        <text textSize="12sp" margin="0 5 0 0" textColor="#ff0000">提示: 按音量下键可随时结束程序</text>
    </vertical>
);

// 监听音量下键
var volumeDownListener = function() {
    console.log("音量下键被按下，准备结束程序...");
    showToast("正在结束程序...", "info");
    // 停止所有线程
    threads.shutDownAll();
    // 关闭UI
    ui.finish();
    // 退出程序
    exit();
};

// 注册音量下键监听
events.observeKey();
events.onKeyDown("volume_down", volumeDownListener);

// 在程序结束时取消监听
ui.emitter.on("exit", function() {
    events.removeAllKeyDownListeners();
});

// 更新状态显示
function updateStatus(status, color) {
    color = color || "#ff7f00";
    ui.run(function() {
        ui.statusText.setText(status);
        ui.statusText.setTextColor(android.graphics.Color.parseColor(color));
    });
}

// 显示提示信息
function showToast(message, type) {
    type = type || 'info';
    switch(type) {
        case 'success':
            console.info(message);
            toast(message);
            updateStatus(message, "#00aa00");
            break;
        case 'error':
            console.error(message);
            toast(message);
            updateStatus(message, "#aa0000");
            break;
        default:
            console.log(message);
            toast(message);
            updateStatus(message);
    }
}

// 获取服务器时间戳
function getServerTimestamp() {
    for (var i = 0; i < CONFIG.TIME_APIs.length; i++) {
        var api = CONFIG.TIME_APIs[i];
        try {
            var options = {
                headers: api.headers || {},
                timeout: CONFIG.HTTP_TIMEOUT
            };
            var response = http.get(api.url, options);
            var responseText = response.body.string();
            return api.parse(responseText);
        } catch (error) {
            console.warn('API请求失败: ' + error.message);
        }
    }
    return Date.now();
}

// 等待并点击按钮
function waitAndClickButton(buttonDescs) {
    for (var i = 0; i < buttonDescs.length; i++) {
        var desc = buttonDescs[i];
        if (classNameStartsWith('android.widget.').desc(desc).exists()) {
            return classNameStartsWith('android.widget.').desc(desc).findOne().click();
        }
    }
    return false;
}

// 检查APP是否已启动
function isAppRunning() {
    try {
        // 使用context.getPackageName()替代currentApp
        var currentPackage = context.getPackageName();
        return currentPackage && (
            currentPackage.includes("damai") || 
            currentPackage.includes("fenwan")
        );
    } catch (e) {
        console.error("检测APP运行状态出错: " + e);
        return false;
    }
}

// 检查是否在详情页
function isInBookingPage() {
    try {
        console.log("正在检测详情页...");
        var bookingBtn = className("android.widget.Button").desc("组队抢票").findOne(1000);
        if (bookingBtn) {
            console.log("找到组队抢票按钮");
            return true;
        }
        console.log("未找到组队抢票按钮");
        return false;
    } catch (e) {
        console.error("检测详情页出错: " + e);
        return false;
    }
}

// 循环检测是否进入详情页
function checkBookingPage() {
    return new Promise((resolve, reject) => {
        threads.start(function() {
            var startTime = new Date().getTime();
            var timeout = 15000; // 增加到15秒超时
            var checkInterval = 300; // 每300ms检查一次，增加检测频率
            
            console.log("开始循环检测详情页...");
            var checker = setInterval(() => {
                if (isInBookingPage()) {
                    clearInterval(checker);
                    console.log("检测到详情页，准备开始抢票");
                    ui.run(() => {
                        showToast("已定位到组队抢票按钮", "success");
                    });
                    
                    // 直接在这里调用后续操作
                    console.log("=== 准备开始时间检测和抢票 ===");
                    startTicketProcessing();
                    
                    resolve(true);
                    return;
                }
                
                // 每3秒显示一次提示信息
                if ((new Date().getTime() - startTime) % 3000 < checkInterval) {
                    ui.run(() => {
                        var remainTime = Math.ceil((timeout - (new Date().getTime() - startTime)) / 1000);
                        showToast("正在查找组队抢票按钮，剩余" + remainTime + "秒...", "info");
                    });
                }
                
                // 检查是否超时
                if (new Date().getTime() - startTime > timeout) {
                    clearInterval(checker);
                    console.log("检测详情页超时");
                    ui.run(() => {
                        showToast("未找到组队抢票按钮，请确认是否在详情页", "error");
                    });
                    resolve(false);
                    return;
                }
            }, checkInterval);
        });
    });
}

// 启动纷玩岛APP
function launchFenwandaoApp() {
    try {
        // 使用app.launchApp直接启动
        var appName = "纷玩岛";
        showToast("正在启动纷玩岛...", "info");
        var result = app.launchApp(appName);
        
        if (result) {
            showToast("纷玩岛启动成功", "success");
            // 使用setTimeout替代sleep
            setTimeout(function() {
                // 启动成功后的操作
                console.log("纷玩岛启动完成");
                // 启动后立即开始检测详情页
                checkBookingPage().then(isInPage => {
                    if (isInPage) {
                        ui.run(() => {
                            showToast("已进入详情页，可以开始抢票", "success");
                        });
                    }
                });
            }, 3000);
            return true;
        } else {
            showToast("纷玩岛启动失败", "error");
            return false;
        }
    } catch (e) {
        showToast("启动出错: " + e.message, "error");
        return false;
    }
}

// 开始抢票
function startFenwandaoTicketGrabbing() {
    console.log("=== 开始抢票流程 ===");
    
    try {
        // 检查APP是否运行
        if (!isAppRunning()) {
            showToast("请先启动纷玩岛APP", "error");
            return;
        }
        
        console.log("APP已运行，开始检测详情页...");
        // 直接开始检测详情页
        checkBookingPage();
        
    } catch (e) {
        console.error("抢票过程出错: " + e);
        showToast("抢票过程出错: " + e.message, "error");
    }
}

// 开始时间检测和抢票流程
function startTicketProcessing() {
    console.log("=== 已进入详情页，开始时间检测 ===");
    
    try {
        // 等待抢票时间
        var targetTime = ui.timeInput.text();
        console.log("设置的目标时间: " + targetTime);
        
        var targetTimestamp = new Date("2024-" + targetTime).getTime();
        console.log("目标时间戳: " + targetTimestamp);
        
        // 计算等待时间
        var currentTime = getServerTimestamp();
        console.log("当前服务器时间: " + currentTime);
        console.log("服务器时间显示: " + new Date(currentTime).toLocaleString());
        
        var waitTime = targetTimestamp - currentTime;
        console.log("需要等待的时间(ms): " + waitTime);
        
        // 如果还有超过2秒
        if (waitTime > 2000) {
            var waitSeconds = Math.floor(waitTime/1000);
            console.log("距离抢票开始还有 " + waitSeconds + " 秒，开始等待...");
            
            ui.run(function() {
                showToast("距离抢票开始还有 " + waitSeconds + " 秒", "info");
            });
            
            // 创建一个单独的线程等待，避免主线程睡眠
            threads.start(function() {
                sleep(waitTime - 2000); // 等待到还剩2秒
                console.log("等待完成，开始监控购买按钮");
                // 开始监控购买按钮
                startBuyButtonMonitoring();
            });
        } else {
            console.log("目标时间已到或小于2秒，立即开始监控");
            // 直接开始监控购买按钮
            startBuyButtonMonitoring();
        }
    } catch (e) {
        console.error("时间检测出错: " + e);
        showToast("时间检测出错: " + e.message, "error");
    }
}

// 监控购买按钮
function startBuyButtonMonitoring() {
    console.log("=== 开始监控购买按钮 ===");
    
    threads.start(function() {
        try {
            console.log("=== 开始执行刷新监控 ===");
            var attempts = 0;
            var maxAttempts = CONFIG.CLICK_CONFIG.MAX_ATTEMPTS;
            var lastRefreshTime = new Date().getTime();
            var refreshInterval = 100; // 每100ms刷新一次
            var lastStatusTime = new Date().getTime();
            
            while (attempts < maxAttempts) {
                attempts++;
                
                if (attempts % 10 === 0) {
                    console.log("第 " + attempts + " 次尝试");
                }
                
                // 检查购买按钮
                var buyButton = className("android.view.View").desc("立即购买").findOne(100);
                if (buyButton) {
                    console.log("找到立即购买按钮，开始点击");
                    showToast("找到立即购买按钮，开始点击", "success");
                    // 点击按钮并开始后续操作
                    buyButton.click();
                    console.log("已点击立即购买按钮");
                    startBuyButtonClicking();
                    return;
                }
                
                // 每100ms刷新一次页面
                var currentTime = new Date().getTime();
                if (currentTime - lastRefreshTime >= refreshInterval) {
                    console.log("执行刷新操作...");
                    // 从上往下滑动刷新，幅度较小
                    var startY = device.height * 0.3;  // 从屏幕30%处开始
                    var endY = device.height * 0.4;    // 滑动到屏幕40%处
                    swipe(device.width / 2, startY, device.width / 2, endY, 100);
                    lastRefreshTime = currentTime;
                    
                    // 每1秒显示一次状态
                    if (currentTime - lastStatusTime >= 1000) {
                        var status = "正在查找购买按钮... 已尝试 " + attempts + " 次";
                        console.log(status);
                        showToast(status, "info");
                        lastStatusTime = currentTime;
                    }
                }
                
                sleep(10); // 短暂休眠，避免CPU占用过高
            }
            
            console.log("=== 监控结束，未找到购买按钮 ===");
            showToast("未找到购买按钮，请检查页面", "error");
            
        } catch (e) {
            console.error("刷新页面出错: " + e);
            showToast("监控购买按钮出错: " + e.message, "error");
        }
    });
}

// 点击购买按钮
function startBuyButtonClicking() {
    threads.start(function() {
        try {
            var attempts = 0;
            var maxAttempts = CONFIG.CLICK_CONFIG.MAX_ATTEMPTS;
            
            while (attempts < maxAttempts) {
                attempts++;
                
                // 检查去支付或立即支付按钮
                var payButton = className("android.widget.Button").desc("去支付").findOne(100) || 
                               className("android.view.View").desc("立即支付").findOne(100);
                if (payButton) {
                    console.log("找到支付按钮，开始点击");
                    showToast("找到支付按钮，开始点击", "success");
                    payButton.click();
                    console.log("已点击支付按钮");
                    sleep(100); // 点击后短暂等待
                    continue; // 继续循环，持续点击支付按钮
                }
                
                // 检查一键抢票按钮
                var quickBuyButton = className("android.view.View").desc("一键抢票").findOne(100);
                if (quickBuyButton) {
                    console.log("找到一键抢票按钮，开始点击");
                    showToast("找到一键抢票按钮，开始点击", "success");
                    quickBuyButton.click();
                    console.log("已点击一键抢票按钮");
                    sleep(100); // 点击后短暂等待
                    continue; // 继续循环，持续点击一键抢票按钮
                }
                
                // 检查确认按钮
                var confirmButton = className("android.view.View").desc("确认").findOne(100);
                if (confirmButton) {
                    console.log("找到确认按钮，开始点击");
                    showToast("找到确认按钮，开始点击", "success");
                    confirmButton.click();
                    console.log("已点击确认按钮");
                    sleep(100); // 点击后短暂等待
                    continue; // 继续循环，持续点击确认按钮
                }
                
                // 如果没找到以上按钮，尝试点击其他可能的购买按钮
                if (text("立即购买").exists()) {
                    text("立即购买").findOne().click();
                } else if (text("立即预定").exists()) {
                    text("立即预定").findOne().click();
                } else if (text("特惠购票").exists()) {
                    text("特惠购票").findOne().click();
                }
                
                sleep(CONFIG.CLICK_CONFIG.CLICK_INTERVAL);
            }
            
        } catch (e) {
            showToast("点击购买按钮出错: " + e.message, "error");
        }
    });
}

// 时间选择相关函数
function showTimePicker() {
    var date = new Date();
    var currentMonth = date.getMonth() + 1;
    var currentDay = date.getDate();
    var currentHour = date.getHours();
    var currentMinute = date.getMinutes();
    
    var defaultTime = currentMonth.toString().padStart(2, '0') + "-" + 
                     currentDay.toString().padStart(2, '0') + " " + 
                     currentHour.toString().padStart(2, '0') + ":" + 
                     currentMinute.toString().padStart(2, '0');
    
    dialogs.rawInput("请输入抢票时间", defaultTime)
        .then(time => {
            if (time) {
                // 验证时间格式
                if (!/^\d{2}-\d{2} \d{2}:\d{2}$/.test(time)) {
                    toast("时间格式不正确，请使用MM-DD HH:mm格式");
                    return;
                }
                ui.timeInput.setText(time);
                ui.selectedTimeText.setText("已选择: " + time);
                showToast("抢票时间已设置为: " + time, "success");
            }
        });
}

// 按钮事件绑定
ui.startBtn.click(function() {
    var time = ui.timeInput.text();
    if (!time || time.trim() === '') {
        showToast("请输入有效的抢票时间!", "error");
        return;
    }
    
    showToast("开始准备抢票，目标时间: " + time, "info");
    startFenwandaoTicketGrabbing();
});

ui.stopBtn.click(function() {
    showToast("已停止抢票", "info");
    threads.shutDownAll();
});

ui.setTimeBtn.click(function() {
    var time = ui.timeInput.text();
    if (!time || time.trim() === '') {
        showToast("请输入有效的抢票时间!", "error");
        return;
    }
    
    showToast("抢票时间已设置为: " + time, "success");
});

ui.launchAppBtn.click(function() {
    if (!isAppRunning()) {
        launchFenwandaoApp();
    } else {
        showToast("纷玩岛已在运行中", "info");
    }
});

ui.showTimePickerBtn.click(function() {
    showTimePicker();
});

// 启动程序
(function start() {
    showToast("纷玩岛抢票助手已启动", "info");
    showToast("请确保已在演出详情页", "info");
    showToast("设置好抢票时间后点击开始", "info");
})(); 