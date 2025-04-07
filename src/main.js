"ui";
"auto";

// 模块加载状态标记
var modulesLoaded = false;

// 加载函数，用于确保模块被正确加载
function loadModules() {
    try {
        // 加载必要的模块
        require('./modules/uiManager');
        require('./modules/autoManager');
        
        // 如果到这一步没有抛出错误，标记模块已加载
        console.log("模块加载成功");
        modulesLoaded = true;
    } catch (e) {
        console.error("模块加载失败: " + e);
        toast("模块加载失败，请查看控制台日志");
    }
}

/**
 * 监听音量下键作为退出程序的快捷方式
 */
function startVolumeKeyListener() {
    // 创建监听线程
    threads.start(function() {
        try {
            console.log("音量下键监听已启动 - 按音量下键可退出程序");
            toast("音量下键监听已启动 - 按音量下键可退出程序");
            
            // 监听音量下键
            events.observeKey();
            events.onKeyDown("volume_down", function(event) {
                console.log("检测到音量下键，正在退出程序...");
                toast("检测到音量下键，正在退出程序...");
                
                // 停止所有线程
                threads.shutDownAll();
                
                // 延迟一点时间后退出程序，以便toast消息能够显示
                setTimeout(function() {
                    exit();
                }, 1000);
            });
        } catch (e) {
            console.error("音量键监听器错误: " + e);
        }
    });
}

// 配置
const CONFIG = {
    IS_DEBUG: false,
    NETWORK_DELAY: 45, // 网络延迟补偿（毫秒）
};

/**
 * 主函数 - 纷玩岛抢票
 */
function main() {
    try {
        // 检查模块是否已加载
        if (!modulesLoaded) {
            toast("模块未完全加载，正在重试...");
            loadModules();
            sleep(200);
            
            if (!modulesLoaded) {
                toast("模块加载失败，无法继续执行");
                return;
            }
        }
        
        // 初始化无障碍服务
        waitForAccessibility();
        
        // 初始化控制台
        initConsole();
        
        // 启动音量下键监听
        startVolumeKeyListener();
        
        // 显示操作提示
        showToast("无障碍服务已启用", "success");
        showToast("请手动进入纷玩岛App并打开目标演出页面", "info");
        showToast("然后在autoManager界面中设置抢票选项", "info");
        showToast("准备就绪后点击[开始抢票]按钮", "info");
        showToast("按音量下键可随时退出程序", "info");
        
        // 控制台提示
        console.log("=============================================");
        console.log("使用说明:");
        console.log("1. 请手动打开纷玩岛App并进入要抢票的演出页面");
        console.log("2. 确保已设置好抢票时间");
        console.log("3. 点击[开始抢票]按钮开始自动抢票");
        console.log("4. 随时按音量下键可立即退出程序");
        console.log("=============================================");
        
    } catch (error) {
        // 使用基本的错误报告方式，避免依赖可能未定义的函数
        toast("运行时错误：" + error.message);
        console.error("运行时错误：" + error.message);
        console.error(error);
    }
}

// 启动程序
(function start() {
    // 首先加载模块
    loadModules();
    
    // 等待200毫秒，确保模块加载完成
    setTimeout(function() {
        // 检查模块是否成功加载
        if (modulesLoaded) {
            main();
        } else {
            toast("无法启动程序：模块加载失败");
        }
    }, 200);
})(); 