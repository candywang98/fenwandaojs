// 坐标查看器
auto.waitFor();

// 创建悬浮窗
var window = floaty.window(
    <frame gravity="center">
        <text id="text" textSize="16sp" textColor="#FF0000"/>
    </frame>
);

// 设置悬浮窗位置
window.setPosition(100, 100);

// 记录按下坐标
var x = 0, y = 0;

// 设置触摸监听
setInterval(()=>{
    // 更新坐标显示
    ui.run(function(){
        window.text.setText(
            "坐标: (" + x + ", " + y + ")\n" +
            "点击位置查看坐标"
        );
    });
}, 16);

// 注册触摸监听
events.on("touch", function(point){
    x = point.x;
    y = point.y;
    log("触摸坐标：(" + x + ", " + y + ")");
});

// 等待退出
events.on("exit", function(){
    toast("退出坐标查看器");
});

// 音量下键退出
events.observeKey();
events.onKeyDown("volume_down", function(event){
    exit();
}); 