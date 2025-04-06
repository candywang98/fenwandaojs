// 触摸事件测试脚本
auto.waitFor();
console.show();  // 显示控制台
console.log("开始运行触摸测试脚本...");

// 创建悬浮窗
var window = floaty.window(
    <frame gravity="center">
        <text id="text" textSize="16sp" textColor="#00FF00"/>
    </frame>
);

// 设置窗口位置
window.setPosition(100, 100);

// 更新显示内容
function updateDisplay(x, y) {
    ui.run(() => {
        window.text.setText("X: " + x + "\nY: " + y);
    });
    console.log("触摸坐标：", x, y);
}

// 初始显示
updateDisplay(0, 0);

// 注册触摸事件监听
events.observeTouch();
events.setTouchEventTimeout(10);

events.on("touch", function(point){
    updateDisplay(point.x, point.y);
});

// 注册音量键退出
events.observeKey();
events.on("key", function(keyCode, event){
    if(keyCode == keys.volume_down){
        // 退出脚本
        console.log("用户按下音量减，退出脚本");
        exit();
    }
});

// 确保退出时清理
events.on('exit', function(){
    if(window != null) {
        window.close();
    }
    events.removeAllListeners();
    console.log("脚本已退出");
});

// 保持脚本运行
setInterval(()=>{}, 1000);

// 显示使用说明
toast("触摸屏幕任意位置显示坐标\n按音量下键退出");

