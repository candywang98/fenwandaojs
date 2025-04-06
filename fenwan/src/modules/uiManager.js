"ui";
"auto";

/**
 * UI管理模块
 */

// 创建UI界面
ui.layout(
    <vertical padding="16">
        <text id="title" textSize="24sp" textColor="#11ee00" textStyle="bold" gravity="center" margin="0 0 0 10">纷玩岛抢票助手</text>
        <horizontal margin="0 20 0 0">
            <text textSize="16sp" layout_gravity="center">抢票时间: </text>
            <input id="timeInput" hint="格式: MM-DD HH:mm" textSize="16sp" layout_weight="1" text="04-21 16:18"/>
            <button id="setTimeBtn" text="设置" style="Widget.AppCompat.Button.Colored" layout_gravity="center"/>
        </horizontal>
        <horizontal margin="0 10 0 0">
            <text textSize="16sp" layout_gravity="center">状态: </text>
            <text id="statusText" text="等待开始" textSize="16sp" textColor="#ff7f00" layout_weight="1"/>
        </horizontal>
        <horizontal margin="0 20 0 0">
            <button id="startBtn" text="开始抢票" style="Widget.AppCompat.Button.Colored" layout_weight="1"/>
            <button id="stopBtn" text="停止" style="Widget.AppCompat.Button.Borderless.Colored" layout_weight="1"/>
        </horizontal>
        <text textSize="12sp" margin="0 20 0 0" textColor="#888888">说明: 请提前打开商品详情页，设置好抢票时间后点击开始</text>
        <text textSize="12sp" margin="0 5 0 0" textColor="#888888">注意: 本工具仅供学习交流，请勿用于商业用途</text>
    </vertical>
);

/**
 * 获取用户输入的抢票时间
 * @param {string} defaultTime - 默认时间值
 * @returns {string} 用户输入的时间
 */
function getSellTime(defaultTime) {
    defaultTime = defaultTime || "04-21 16:18";
    var input = rawInput("请输入抢票时间(格式: MM-DD HH:mm)", defaultTime);
    if (!input || input.trim() === '') {
        toast("请输入有效的抢票时间!");
        return getSellTime(defaultTime);
    }
    return input;
}

/**
 * 从UI界面获取抢票时间
 * @returns {string} 用户在UI输入的时间
 */
function getUITime() {
    return ui.timeInput.text();
}

/**
 * 更新状态显示
 * @param {string} status - 状态文本
 * @param {string} color - 文本颜色，默认为橙色
 */
function updateStatus(status, color) {
    color = color || "#ff7f00";
    ui.run(function() {
        ui.statusText.setText(status);
        ui.statusText.setTextColor(android.graphics.Color.parseColor(color));
    });
}

/**
 * 显示操作提示
 * @param {string} message - 提示信息
 * @param {string} type - 提示类型 ('info' | 'success' | 'error')
 */
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

/**
 * 初始化控制台
 */
function initConsole() {
    try {
        // 打开控制台
        openConsole();
        
        // 尝试设置控制台标题，但不传递颜色和大小参数
        // 由于不同版本的Auto.js可能有不同的API支持，使用try-catch保证不会崩溃
        try {
            console.setTitle("纷玩岛抢票助手");
        } catch (e) {
            console.log("设置控制台标题失败: " + e.message);
        }
        
        // 使用log输出一个醒目的标题，作为替代方案
        console.log("========================================");
        console.log("           纷玩岛抢票助手              ");
        console.log("========================================");
    } catch (e) {
        console.error("初始化控制台失败: " + e.message);
    }
}

// 设置按钮点击事件
ui.setTimeBtn.click(function() {
    var time = ui.timeInput.text();
    if (!time || time.trim() === '') {
        showToast("请输入有效的抢票时间!", "error");
        return;
    }
    
    showToast("抢票时间已设置为: " + time, "success");
});

ui.startBtn.click(function() {
    var time = ui.timeInput.text();
    if (!time || time.trim() === '') {
        showToast("请输入有效的抢票时间!", "error");
        return;
    }
    
    showToast("开始准备抢票，目标时间: " + time, "info");
    // 此处可以调用其他模块的抢票功能
});

ui.stopBtn.click(function() {
    showToast("已停止抢票", "info");
    // 此处可以调用停止抢票的功能
});

// 直接导出函数到全局空间
global.getSellTime = getSellTime;
global.getUITime = getUITime;
global.showToast = showToast;
global.updateStatus = updateStatus;
global.initConsole = initConsole;

// 初始化控制台
initConsole();

// 输出模块加载成功消息
console.log("UI管理模块加载成功"); 