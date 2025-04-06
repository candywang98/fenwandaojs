// 调试版本的抢票脚本
auto.waitFor();
console.show();

// 创建调试悬浮窗
var debugWindow = floaty.window(
    <frame gravity="center">
        <vertical>
            <text id="debug" textSize="14sp" textColor="#00FF00"/>
            <text id="hint" text="点击屏幕记录坐标" textSize="12sp" textColor="#FFFFFF"/>
        </vertical>
    </frame>
);

// 设置窗口
debugWindow.setPosition(50, 50);

// 调试信息显示
function showDebugInfo(info) {
    ui.run(function(){
        debugWindow.debug.setText(info);
    });
    console.log(info);
}

// 坐标记录
var clickPoints = [];
var isRunning = true;

// 显示使用说明
toast("请按照以下步骤操作：\n1.打开纷玩岛APP\n2.进入要抢票的页面\n3.依次点击需要记录的位置\n4.按音量下键保存并退出");
showDebugInfo("准备开始记录坐标...\n请按实际抢票顺序点击：\n1.立即购买按钮\n2.确认按钮\n3.其他需要点击的位置");

// 注册触摸事件监听
events.observeTouch();
events.setTouchEventTimeout(10);
events.on("touch_down", function(p){
    if(!isRunning) return;
    
    var pointData = {x: p.x, y: p.y, time: new Date().toTimeString()};
    clickPoints.push(pointData);
    
    showDebugInfo("已记录 " + clickPoints.length + " 个坐标点\n最新点击: (" + p.x + ", " + p.y + ")");
    toast("记录第 " + clickPoints.length + " 个坐标");
    console.log("记录坐标点" + clickPoints.length + ": (" + p.x + ", " + p.y + ")");
});

// 初始化按键监听
events.observeKey();

// 监听音量键
events.on("key", function(keyCode, event){
    if(!isRunning) return;
    
    if(keyCode == keys.volume_down){
        // 保存并退出
        isRunning = false;
        
        if(clickPoints.length === 0) {
            toast("没有记录到坐标！请先点击屏幕");
            return;
        }
        
        // 打印分隔线
        console.log("========================");
        console.log("开始保存坐标信息：");
        
        // 生成输出信息
        console.log("【记录的坐标点】");
        clickPoints.forEach((point, index) => {
            console.log("点击" + (index + 1) + ": X=" + point.x + ", Y=" + point.y);
        });
        
        // 打印分隔线
        console.log("========================");
        console.log("【生成的配置代码】");
        
        // 生成配置代码
        clickPoints.forEach((point, index) => {
            console.log("const Click" + (index + 1) + "X = " + point.x + ";");
            console.log("const Click" + (index + 1) + "Y = " + point.y + ";");
        });
        
        // 打印分隔线
        console.log("========================");
        
        toast("已保存坐标信息到日志，请查看日志");
        
        // 清理并退出
        if(debugWindow !== null) debugWindow.close();
        exit();
    } else if(keyCode == keys.volume_up){
        // 直接退出
        isRunning = false;
        console.log("用户取消记录，直接退出");
        toast("直接退出，不保存坐标");
        if(debugWindow !== null) debugWindow.close();
        exit();
    }
});

// 确保退出时清理
events.on('exit', function(){
    if(debugWindow !== null) debugWindow.close();
    events.removeAllListeners();
    console.log("脚本执行完毕");
    toast("脚本已退出");
});

// 保持脚本运行
setInterval(()=>{}, 1000); 