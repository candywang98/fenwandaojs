"ui";
"auto";

/**
 * 自动化操作管理模块
 */

// 创建简单UI界面
ui.layout(
    <vertical padding="16">
        <text id="title" textSize="24sp" textColor="#11ee00" textStyle="bold" gravity="center" margin="0 0 0 10">纷玩岛抢票助手</text>
        <horizontal margin="0 20 0 0">
            <text textSize="16sp" layout_gravity="center">应用名称: </text>
            <input id="appNameInput" hint="输入要启动的应用名称" textSize="16sp" layout_weight="1" text="纷玩岛"/>
            <button id="launchBtn" text="启动" style="Widget.AppCompat.Button.Colored"/>
        </horizontal>
        <horizontal margin="0 10 0 0">
            <text textSize="16sp" layout_gravity="center">抢票时间: </text>
            <input id="timeInput" hint="格式: MM-DD HH:mm:ss" textSize="16sp" layout_weight="1" text="04-06 14:23:00"/>
        </horizontal>
        <horizontal margin="0 10 0 0">
            <text textSize="16sp" layout_gravity="center">票价选择: </text>
            <spinner id="priceSpinner" entries="980元|680元|480元|1280元|任意可用票价" textSize="16sp" layout_weight="1"/>
        </horizontal>
        <horizontal margin="0 10 0 0">
            <text textSize="16sp" layout_gravity="center">状态: </text>
            <text id="statusText" text="准备就绪" textSize="16sp" textColor="#ff7f00" layout_weight="1"/>
        </horizontal>
        <horizontal margin="0 20 0 0">
            <button id="waitAccessBtn" text="等待无障碍" style="Widget.AppCompat.Button.Colored" layout_weight="1"/>
            <button id="startGrabBtn" text="开始抢票" style="Widget.AppCompat.Button.Colored" layout_weight="1"/>
        </horizontal>
        <horizontal margin="0 10 0 0">
            <button id="stopGrabBtn" text="停止抢票" style="Widget.AppCompat.Button.Colored" layout_weight="1"/>
            <checkbox id="debugModeCheck" text="调试模式" checked="true"/>
        </horizontal>
        <vertical margin="0 20 0 0">
            <text textSize="14sp" textColor="#888888" gravity="center">操作说明</text>
            <text textSize="12sp" textColor="#888888" margin="0 5 0 0">1. 请先手动打开纷玩岛App，进入目标演出页面</text>
            <text textSize="12sp" textColor="#888888" margin="0 5 0 0">2. 找到预约抢票按钮所在的页面</text>
            <text textSize="12sp" textColor="#888888" margin="0 5 0 0">3. 点击[等待无障碍]按钮，确保服务已启用</text>
            <text textSize="12sp" textColor="#888888" margin="0 5 0 0">4. 点击[开始抢票]按钮，然后等待抢票开始</text>
            <text textSize="12sp" textColor="#888888" margin="0 5 0 0">* 调试模式下会立即点击预约抢票按钮</text>
            <text textSize="12sp" textColor="#888888" margin="0 5 0 0">* 随时按音量下键可立即退出程序</text>
        </vertical>
        <button id="specialClickBtn" text="特殊点击" style="Widget.AppCompat.Button.Colored" layout_gravity="bottom|center" margin="0 0 0 10"/>
    </vertical>
);

// 更新状态显示
function updateStatus(status, color) {
    color = color || "#ff7f00";
    ui.run(function() {
        ui.statusText.setText(status);
        ui.statusText.setTextColor(android.graphics.Color.parseColor(color));
    });
}

// 默认点击坐标配置
var DEFAULT_CONFIRM_COORDS = {
    x: 878,
    y: 2263
};

// 调试模式点击坐标 - 更新为用户提供的预约抢票按钮的确切位置
var DEBUG_COORDS = {
    x: 747,  // 用户提供的预约抢票按钮X坐标
    y: 2252  // 用户提供的预约抢票按钮Y坐标
};

// 提供多个测试点坐标，以提高命中率 - 使用用户提供的坐标为主
var TEST_COORDS = [
    {x: 747, y: 2252},  // 用户提供的预约抢票按钮确切位置
    {x: 740, y: 2245},  // 稍微偏上偏左
    {x: 755, y: 2245},  // 稍微偏上偏右
    {x: 740, y: 2260},  // 稍微偏下偏左
    {x: 755, y: 2260}   // 稍微偏下偏右
];

// 当前测试坐标索引
var currentTestIndex = 0;

/**
 * 等待并点击指定按钮
 * @param {Array<string>} buttonDescs - 按钮描述数组
 * @returns {boolean} 是否成功点击
 */
function waitAndClickButton(buttonDescs) {
    for (var i = 0; i < buttonDescs.length; i++) {
        var desc = buttonDescs[i];
        if (classNameStartsWith('android.widget.').desc(desc).exists()) {
            return classNameStartsWith('android.widget.').desc(desc).findOne().click();
        }
    }
    return false;
}

/**
 * 执行确认点击
 * @param {boolean} isDebug - 是否为调试模式
 * @param {Object} coords - 自定义坐标
 */
function performConfirmClick(isDebug, coords) {
    isDebug = isDebug || false;
    coords = coords || DEFAULT_CONFIRM_COORDS;
    
    // 使用线程执行点击操作，避免在UI线程执行手势
    threads.start(function() {
        try {
            console.log("开始执行点击操作...");
            updateStatus("开始执行点击操作...");
            
            // 定义可能的控件查找方式
            var foundAndClicked = false;
            
            // 方式1: 通过准确的控件类型和描述查找
            if (className("android.view.View").desc("预约抢票").exists()) {
                console.log("方式1: 找到预约抢票控件(android.view.View + desc)，点击中...");
                updateStatus("找到预约抢票控件(view+desc)，点击中...", "#00aa00");
                className("android.view.View").desc("预约抢票").findOne().click();
                foundAndClicked = true;
            }
            
            // 方式1b: 通过准确的控件类型和描述查找组队抢票
            else if (className("android.view.View").desc("组队抢票").exists()) {
                console.log("方式1b: 找到组队抢票控件(android.view.View + desc)，点击中...");
                updateStatus("找到组队抢票控件(view+desc)，点击中...", "#00aa00");
                className("android.view.View").desc("组队抢票").findOne().click();
                foundAndClicked = true;
            }
            
            // 方式2: 通过文本查找
            else if (text("预约抢票").exists()) {
                console.log("方式2: 找到预约抢票按钮(text)，点击中...");
                updateStatus("找到预约抢票按钮(text)，点击中...", "#00aa00");
                text("预约抢票").findOne().click();
                foundAndClicked = true;
            }
            
            // 方式2b: 通过文本查找组队抢票
            else if (text("组队抢票").exists()) {
                console.log("方式2b: 找到组队抢票按钮(text)，点击中...");
                updateStatus("找到组队抢票按钮(text)，点击中...", "#00aa00");
                text("组队抢票").findOne().click();
                foundAndClicked = true;
            }
            
            // 方式3: 通过任意控件类型和描述查找
            else if (descContains("预约抢票").exists()) {
                console.log("方式3: 找到预约抢票的控件(descContains)，点击中...");
                updateStatus("找到预约抢票控件(descContains)，点击中...", "#00aa00");
                descContains("预约抢票").findOne().click();
                foundAndClicked = true;
            }
            
            // 方式3b: 通过任意控件类型和描述查找组队抢票
            else if (descContains("组队抢票").exists()) {
                console.log("方式3b: 找到组队抢票的控件(descContains)，点击中...");
                updateStatus("找到组队抢票控件(descContains)，点击中...", "#00aa00");
                descContains("组队抢票").findOne().click();
                foundAndClicked = true;
            }
            
            // 方式4: 通过文本部分匹配查找
            else if (textContains("预约抢票").exists()) {
                console.log("方式4: 找到预约抢票控件(textContains)，点击中...");
                updateStatus("找到预约抢票控件(textContains)，点击中...", "#00aa00");
                textContains("预约抢票").findOne().click();
                foundAndClicked = true;
            }
            
            // 方式4b: 通过文本部分匹配查找组队抢票
            else if (textContains("组队抢票").exists()) {
                console.log("方式4b: 找到组队抢票控件(textContains)，点击中...");
                updateStatus("找到组队抢票控件(textContains)，点击中...", "#00aa00");
                textContains("组队抢票").findOne().click();
                foundAndClicked = true;
            }
            
            // 方式5: 通过按钮类寻找
            else if (className("android.widget.Button").textContains("预约").exists()) {
                console.log("方式5: 找到预约按钮控件，点击中...");
                updateStatus("找到预约按钮控件，点击中...", "#00aa00");
                className("android.widget.Button").textContains("预约").findOne().click();
                foundAndClicked = true;
            }
            
            // 方式5b: 通过按钮类寻找组队
            else if (className("android.widget.Button").textContains("组队").exists()) {
                console.log("方式5b: 找到组队按钮控件，点击中...");
                updateStatus("找到组队按钮控件，点击中...", "#00aa00");
                className("android.widget.Button").textContains("组队").findOne().click();
                foundAndClicked = true;
            }
            
            // 如果以上方式都找不到，尝试坐标点击
            if (foundAndClicked) {
                console.log("通过控件查找成功点击");
                updateStatus("控件点击成功", "#00aa00");
                return;
            }
            
            // 以下是坐标点击逻辑
            console.log("未通过控件找到按钮，尝试坐标点击");
            
            if (isDebug) {
                // 使用当前测试坐标
                var clickCoords = TEST_COORDS[currentTestIndex];
                console.log("执行调试模式点击: " + clickCoords.x + "," + clickCoords.y + " (测试点 " + (currentTestIndex + 1) + "/" + TEST_COORDS.length + ")");
                updateStatus("执行调试点击 #" + (currentTestIndex + 1) + ": " + clickCoords.x + "," + clickCoords.y);
                
                // 尝试点击
                try {
                    click(clickCoords.x, clickCoords.y);
                    console.log("调试点击操作执行成功");
                    
                    // 检查点击后是否找到预约抢票按钮
                    setTimeout(function() {
                        // 使用正确的控件选择器检查
                        if (className("android.view.View").desc("预约抢票").exists()) {
                            console.log("找到预约抢票控件(desc)，再次点击...");
                            updateStatus("找到预约抢票控件(desc)，再次点击...", "#00aa00");
                            className("android.view.View").desc("预约抢票").findOne().click();
                            
                            console.log("预约抢票控件点击完成");
                            updateStatus("预约抢票控件点击完成", "#00aa00");
                            return;
                        }
                        
                        // 如果不是最后一个测试点，设置下一次点击
                        if (currentTestIndex < TEST_COORDS.length - 1) {
                            currentTestIndex++;
                            // 2秒后尝试下一个点
                            setTimeout(function() {
                                performConfirmClick(true);
                            }, 2000);
                        } else {
                            // 重置测试点索引
                            currentTestIndex = 0;
                            updateStatus("所有测试点都已尝试", "#ffaa00");
                        }
                    }, 500);
                } catch (clickError) {
                    console.error("调试点击操作失败: " + clickError);
                }
            } else {
                // 尝试坐标点击
                updateStatus("执行确认点击: " + coords.x + "," + coords.y);
                click(coords.x, coords.y);
                
                // 使用setTimeout代替sleep进行等待
                setTimeout(function() {
                    try {
                        // 尝试正确的控件选择器查找按钮点击
                        if (className("android.view.View").desc("预约抢票").exists()) {
                            console.log("找到预约抢票控件(desc)，点击中...");
                            updateStatus("找到预约抢票控件(desc)，点击中...");
                            className("android.view.View").desc("预约抢票").findOne().click();
                        } else if (text("确认").exists()) {
                            console.log("找到确认按钮，点击中...");
                            updateStatus("找到确认按钮，点击中...");
                            text("确认").findOne().click();
                        } else if (text("预约抢票").exists()) {
                            console.log("找到预约抢票按钮(text)，点击中...");
                            updateStatus("找到预约抢票按钮(text)，点击中...");
                            text("预约抢票").findOne().click();
                        }
                        
                        console.log("点击操作完成");
                        updateStatus("点击操作完成", "#00aa00");
                    } catch (e) {
                        console.error("二次点击失败: " + e);
                        updateStatus("二次点击失败: " + e.message, "#aa0000");
                    }
                }, 500);
            }
            
        } catch (e) {
            updateStatus("点击操作失败: " + e.message, "#aa0000");
            console.error("点击操作失败: " + e);
        }
    });
}

/**
 * 等待无障碍服务
 */
function waitForAccessibility() {
    auto.waitFor();
    updateStatus("无障碍服务已启用", "#00aa00");
}

/**
 * 启动应用
 * @param {string} appName - 应用名称
 */
function launchApplication(appName) {
    updateStatus("正在启动应用: " + appName);
    var result = app.launchApp(appName);
    if (result) {
        updateStatus("应用启动成功", "#00aa00");
    } else {
        updateStatus("应用启动失败", "#aa0000");
    }
    return result;
}

/**
 * 执行提交订单操作
 * @param {boolean} isDebug - 是否为调试模式
 */
function submitOrder(isDebug) {
    isDebug = isDebug || false;
    
    if (isDebug) {
        console.log("调试模式，不执行实际提交操作");
        updateStatus("调试模式：模拟提交订单", "#0000aa");
        return;
    }

    // 使用线程执行提交订单，避免在UI线程执行手势
    threads.start(function() {
        try {
            updateStatus("开始提交订单...");
            
            var maxAttempts = 5;
            var attempts = 0;
            
            while (attempts < maxAttempts) {
                attempts++;
                updateStatus("提交订单尝试: " + attempts + "/" + maxAttempts);
                
                if(className("android.widget.Button").desc("提交订单").exists()){
                    className("android.widget.Button").desc("提交订单").findOne().click();
                }
                
                sleep(300); // 等待UI响应
                
                if(descContains("重新选择").exists()){
                    descContains("重新选择").findOne().click();
                }
                
                sleep(200); // 等待UI响应
                
                if(textContains("重新选择").exists()){
                    textContains("重新选择").findOne().click();
                }
                
                sleep(200); // 等待UI响应
                
                if(className("android.widget.Button").desc("确认").exists()){
                    className("android.widget.Button").desc("确认").findOne().click();
                }
                
                sleep(500); // 等待UI响应
                
                if(descContains("确认并支付").exists() || textContains("确认并支付").exists()){
                    updateStatus("抢票成功！", "#00aa00");
                    return;
                }
            }
            
            updateStatus("提交订单失败，达到最大尝试次数", "#aa0000");
        } catch (e) {
            updateStatus("提交订单过程出错: " + e.message, "#aa0000");
            console.error("提交订单过程出错: " + e);
        }
    });
}

// 设置按钮点击事件
ui.launchBtn.click(function() {
    var appName = ui.appNameInput.text();
    if (!appName || appName.trim() === '') {
        updateStatus("请输入应用名称", "#aa0000");
        return;
    }
    
    launchApplication(appName);
});

ui.waitAccessBtn.click(function() {
    updateStatus("正在检查无障碍服务...");
    waitForAccessibility();
});

/**
 * 检查是否在预约抢票页面
 * @returns {boolean} 是否在预约抢票页面
 */
function isInBookingPage() {
    // 打印详细的控件信息以便调试
    console.log("开始检测预约抢票控件...");
    console.log("当前页面上所有可见的文本:");
    
    // 获取并打印所有可见文本，帮助调试
    var allTexts = [];
    textMatches(/.+/).find().forEach(function(t) {
        allTexts.push(t.text());
        console.log("  - 文本: " + t.text());
    });
    
    // 获取并打印所有可见描述，帮助调试
    console.log("当前页面上所有可见的描述:");
    var allDescs = [];
    descMatches(/.+/).find().forEach(function(d) {
        allDescs.push(d.desc());
        console.log("  - 描述: " + d.desc());
    });
    
    // 尝试多种方式检查预约抢票控件
    
    // 方式1: 通过准确的控件类型和描述查找
    if (className("android.view.View").desc("预约抢票").exists() || className("android.view.View").desc("组队抢票").exists()) {
        console.log("✅ 方式1成功: 找到预约/组队抢票控件(android.view.View + desc)");
        return true;
    }
    
    // 新方式: 通过Button类型和描述查找
    if (className("android.widget.Button").desc("预约抢票").exists() || className("android.widget.Button").desc("组队抢票").exists()) {
        console.log("✅ 新方式成功: 找到预约/组队抢票控件(android.widget.Button + desc)");
        return true;
    }
    
    // 方式2: 通过文本查找
    if (text("预约抢票").exists() || text("组队抢票").exists()) {
        console.log("✅ 方式2成功: 找到预约/组队抢票按钮(text)");
        return true;
    }
    
    // 方式3: 通过任意控件类型和描述查找
    if (descContains("预约抢票").exists() || descContains("组队抢票").exists()) {
        console.log("✅ 方式3成功: 找到包含预约/组队抢票的控件(任意类型 + descContains)");
        return true;
    }
    
    // 方式4: 通过文本部分匹配查找
    if (textContains("预约抢票").exists() || textContains("组队抢票").exists()) {
        console.log("✅ 方式4成功: 找到包含预约/组队抢票的控件(textContains)");
        return true;
    }
    
    // 方式5: 通过按钮类寻找
    if (className("android.widget.Button").textContains("预约").exists() || className("android.widget.Button").textContains("组队").exists()) {
        console.log("✅ 方式5成功: 找到包含预约/组队的按钮控件");
        return true;
    }
    
    // 方式6: 通过控件ID查找（如果应用使用ID）
    try {
        if (id("book_btn").exists() || id("reserve_btn").exists() || id("team_btn").exists()) {
            console.log("✅ 方式6成功: 找到可能的预约/组队按钮ID");
            return true;
        }
    } catch (e) {
        // ID方式查找可能在某些版本不支持，忽略错误
    }
    
    console.log("❌ 未检测到预约/组队抢票页面，尝试了所有检测方式均失败");
    return false;
}

// 更新ui.startGrabBtn.click函数
ui.startGrabBtn.click(function() {
    // 显示一次当前的控件信息（无论是否调试模式）
    toast("正在分析页面控件...");
    updateStatus("正在分析页面控件...");
    
    // 分析当前页面所有控件的文本和描述
    threads.start(function() {
        console.log("========= 当前页面控件分析 =========");
        console.log("设备分辨率: " + device.width + "x" + device.height);
        
        // 收集文本控件
        console.log("所有可见文本控件:");
        var allTexts = [];
        textMatches(/.+/).find().forEach(function(t) {
            allTexts.push(t.text());
            console.log("  - 文本: " + t.text() + (t.clickable() ? " [可点击]" : ""));
        });
        
        // 收集描述控件
        console.log("所有可见描述控件:");
        var allDescs = [];
        descMatches(/.+/).find().forEach(function(d) {
            allDescs.push(d.desc());
            console.log("  - 描述: " + d.desc() + (d.clickable() ? " [可点击]" : ""));
        });
        
        // 收集可点击控件
        console.log("所有可点击控件:");
        var clickableNodes = [];
        className("android.view.View").clickable(true).find().forEach(function(c) {
            var info = "类型: " + c.className();
            if(c.text()) info += ", 文本: " + c.text();
            if(c.desc()) info += ", 描述: " + c.desc();
            info += ", 坐标: (" + c.bounds().centerX() + "," + c.bounds().centerY() + ")";
            clickableNodes.push(info);
            console.log("  - " + info);
        });
        
        // 尝试直接获取预约按钮 
        console.log("尝试获取预约相关按钮:");
        var allWebviews = className("android.webkit.WebView").find();
        if(allWebviews.length > 0) {
            console.log("找到 " + allWebviews.length + " 个WebView控件");
            // 分析WebView中的控件
            allWebviews.forEach(function(webview, index) {
                console.log("WebView #" + (index + 1) + ":");
                // 尝试获取其中的文本
                var webTexts = webview.findByText(/.+/);
                webTexts.forEach(function(t) {
                    console.log("  - WebView文本: " + t.text());
                });
            });
        }
        
        // 收集按钮控件
        console.log("所有按钮控件:");
        className("android.widget.Button").find().forEach(function(b) {
            var info = "文本: " + (b.text() || "无") + ", 描述: " + (b.desc() || "无");
            info += ", 坐标: (" + b.bounds().centerX() + "," + b.bounds().centerY() + ")";
            console.log("  - " + info);
        });
        
        console.log("========= 控件分析完成 =========");
        
        // 给用户一个反馈
        if (allTexts.length || allDescs.length || clickableNodes.length) {
            toast("控件分析完成，控件信息已写入日志");
            updateStatus("已分析页面控件，可查看日志获取详情", "#00aa00");
        } else {
            toast("未找到有用的控件信息");
            updateStatus("未找到有用的控件信息", "#ffaa00");
        }
        
        // 预约抢票按钮是网页控件的特殊处理
        if(allTexts.indexOf("预约抢票") >= 0 || allDescs.indexOf("预约抢票") >= 0) {
            console.log("🎯 在普通控件中找到预约抢票相关文本");
        } else {
            console.log("❓ 未在普通控件中找到预约抢票相关文本");
            
            // 尝试通过深度查找控件
            console.log("尝试深度查找预约抢票控件:");
            try {
                // 遍历所有可见控件
                className("*").depth(6).find().forEach(function(node) {
                    if(node.text() && node.text().indexOf("预约") >= 0) {
                        console.log("  - 深度为6的预约相关控件: " + node.text() + ", 类型: " + node.className());
                    }
                    if(node.desc() && node.desc().indexOf("预约") >= 0) {
                        console.log("  - 深度为6的预约相关控件: " + node.desc() + ", 类型: " + node.className());
                    }
                });
                
                // 增加对深度7-12的控件也进行查找
                for(var depth = 7; depth <= 12; depth++) {
                    className("*").depth(depth).find().forEach(function(node) {
                        if(node.text() && node.text().indexOf("预约") >= 0) {
                            console.log("  - 深度为"+depth+"的预约相关控件: " + node.text() + ", 类型: " + node.className());
                        }
                        if(node.desc() && node.desc().indexOf("预约") >= 0) {
                            console.log("  - 深度为"+depth+"的预约相关控件: " + node.desc() + ", 类型: " + node.className());
                        }
                    });
                }
            } catch(e) {
                console.log("深度查找控件时出错: " + e);
            }
        }
    });
    
    // 延迟检查页面是否在预约抢票页面，给控件加载足够时间
    setTimeout(function() {
        updateStatus("正在初始化抢票流程...");
        
        // 如果是调试模式，显示调试信息
        if (ui.debugModeCheck.checked) {
            updateStatus("调试模式：开始分析页面控件", "#0000aa");
            toast("调试模式已启动，将分析页面控件");
            
            // 暂停一秒后开始调试
            setTimeout(function() {
                showDebugInfo(true);
                updateStatus("调试模式：显示坐标并执行点击测试", "#0000aa");
            }, 1000);
        } else {
            // 非调试模式，直接启动抢票流程
            updateStatus("正常模式：启动抢票流程", "#00aa00");
            toast("正在启动抢票流程，将自动检测页面状态");
            
            // 直接启动抢票流程
            startFenwandaoTicketGrabbing();
        }
    }, 3000); // 等待3秒钟再初始化，给控件足够时间加载
});

ui.stopGrabBtn.click(function() {
    // 停止所有线程
    threads.shutDownAll();
    updateStatus("已停止抢票", "#aa0000");
});

/**
 * 纷玩岛抢票配置项
 */
var FENWANDAO_CONFIG = {
    // 票价优先级 (按索引顺序)
    PRICE_PRIORITIES: ["980元", "680元", "480元", "1280元"],
    
    // 默认坐标配置（根据实际设备调整）
    COORDS: {
        BUY_NOW_BTN: {x: 747, y: 2252},      // 预约抢票/立即购买按钮 - 更新为用户提供的坐标
        TICKET_SELECT: {x: 612, y: 1806},    // 票品选择 - 已更新为用户提供的坐标
        CONFIRM_BTN: {x: 747, y: 2252},      // 确认按钮
        ONE_CLICK_BUY: {x: 540, y: 1900},    // 一键抢票按钮
        CONFIRM_PAY: {x: 747, y: 2252}       // 确认支付按钮
    },
    
    // 点击配置
    CLICK_CONFIG: {
        MAX_ATTEMPTS: 200,           // 最大点击尝试次数 (大幅增加)
        INTERVAL: 1,                 // 点击间隔（毫秒）- 降低到1ms实现最快点击
        STAGE_TIMEOUT: 1000          // 每个阶段超时时间（毫秒）- 减少到1000ms
    }
};

/**
 * 等待开售并开始刷新页面
 * @param {number} targetTime - 目标时间戳
 */
function waitForSaleStart(targetTime) {
    var isDebug = ui.debugModeCheck.checked;
    
    updateStatus("等待开售，目标时间: " + new Date(targetTime).toLocaleString());
    
    // 计算当前时间和目标时间的差值
    var now = new Date().getTime();
    var diffTime = targetTime - now;
    
    if (diffTime > 0 && !isDebug) {
        // 如果目标时间还未到，设置定时器
        updateStatus("距离开售还有: " + Math.floor(diffTime / 1000) + "秒");
        
        // 创建倒计时线程
        threads.start(function() {
            // 创建一个定时器，每秒更新倒计时显示
            var countdownTimer = setInterval(function() {
                var currentTime = new Date().getTime();
                var remainingTime = targetTime - currentTime;
                
                if (remainingTime <= 0) {
                    // 倒计时结束，清除定时器
                    clearInterval(countdownTimer);
                    updateStatus("开售时间到，开始抢票！", "#ff0000");
                    
                    // 直接开始刷新页面查找购买按钮
                    startRefreshUntilBuyButton();
                    return;
                }
                
                // 更新状态显示
                var seconds = Math.floor(remainingTime / 1000);
                var minutes = Math.floor(seconds / 60);
                var hours = Math.floor(minutes / 60);
                
                seconds = seconds % 60;
                minutes = minutes % 60;
                
                var timeString = "";
                if (hours > 0) {
                    timeString += hours + "小时";
                }
                if (minutes > 0 || hours > 0) {
                    timeString += minutes + "分";
                }
                timeString += seconds + "秒";
                
                updateStatus("距离开售还有: " + timeString, "#ff7f00");
            }, 1000); // 每秒更新一次
            
            // 提前3秒开始准备，以补偿可能的时间差
            var sleepTime = diffTime - 3000;
            if (sleepTime > 0) {
                sleep(sleepTime);
            }
            
            // 清除倒计时定时器
            clearInterval(countdownTimer);
            updateStatus("即将开售，准备刷新...", "#ffaa00");
            
            // 开始刷新页面直到发现购买按钮
            startRefreshUntilBuyButton();
        });
    } else {
        // 如果已经过了目标时间或者是调试模式，直接开始刷新
        updateStatus("立即开始刷新寻找购买按钮", "#ffaa00");
        startRefreshUntilBuyButton();
    }
}

/**
 * 刷新页面直到发现购买按钮
 */
function startRefreshUntilBuyButton() {
    threads.start(function() {
        try {
            updateStatus("开始寻找购买按钮...");
            
            // 首先检查是否已经在详情页（组队抢票按钮作为主要判断依据）
            if (text("组队抢票").exists() || descContains("组队抢票").exists() || 
                text("预约抢票").exists() || descContains("预约抢票").exists() ||
                className("android.widget.Button").desc("组队抢票").exists() ||
                className("android.widget.Button").desc("预约抢票").exists()) {
                updateStatus("已经在演出详情页，开始寻找购买按钮", "#00aa00");
                toast("已经在演出详情页，将持续检测购买按钮");
                
                // 直接开始监测购买按钮，不需要刷新页面
                startBuyButtonMonitoring();
                return;
            }
            
            // 循环检测直到确认进入演出详情页或直接找到购买按钮
            var isInDetailPage = false;
            var foundBuyButton = false;
            var detailPageCheckAttempts = 0;
            var maxDetailPageCheckAttempts = 30; // 最多尝试30次，可以根据需要调整
            
            while (!isInDetailPage && !foundBuyButton && detailPageCheckAttempts < maxDetailPageCheckAttempts) {
                detailPageCheckAttempts++;
                
                try {
                    // 首先检查是否直接找到购买按钮，如果找到就直接开始点击
                    if (text("立即购买").exists()) {
                        foundBuyButton = true;
                        updateStatus("直接找到立即购买按钮！", "#00aa00");
                        startBuyButtonClicking();
                        return; // 直接返回，不继续执行后面的代码
                    } else if (text("立即预定").exists() || text("立即预订").exists()) {
                        foundBuyButton = true;
                        updateStatus("直接找到立即预订按钮！", "#00aa00");
                        startBuyButtonClicking();
                        return;
                    } else if (text("特惠购票").exists()) {
                        foundBuyButton = true;
                        updateStatus("直接找到特惠购票按钮！", "#00aa00");
                        startBuyButtonClicking();
                        return;
                    }
                    
                    // 如果没找到购买按钮，检查是否在演出详情页
                    // 使用组队抢票或预约抢票按钮作为主要判断依据
                    if (text("组队抢票").exists() || descContains("组队抢票").exists() || 
                        text("预约抢票").exists() || descContains("预约抢票").exists() ||
                        className("android.widget.Button").desc("组队抢票").exists() ||
                        className("android.widget.Button").desc("预约抢票").exists()) {
                        isInDetailPage = true;
                        updateStatus("已检测到演出详情页（找到组队/预约抢票按钮）", "#00aa00");
                    } 
                    // 其他详情页特征作为辅助判断
                    else if (text("场次").exists() || text("购票须知").exists() || 
                        text("选择场次").exists() || text("选择票品").exists()) {
                        isInDetailPage = true;
                        updateStatus("已检测到演出详情页（辅助特征）", "#00aa00");
                    } else {
                        // 更新检测状态，每5次提示一次
                        if (detailPageCheckAttempts % 5 === 0) {
                            updateStatus("正在尝试检测演出详情页... 已尝试 " + detailPageCheckAttempts + " 次", "#ffaa00");
                            toast("请确保手动进入演出详情页，系统正在持续检测");
                        }
                        
                        // 尝试执行滑动刷新操作
                        swipe(device.width / 2, device.height / 4, device.width / 2, device.height / 2, 100);
                        
                        // 等待一段时间再次检测
                        sleep(5000); // 每1秒检测一次，减少刷新频率
                    }
                } catch (e) {
                    console.error("检查页面失败: " + e);
                    sleep(5000); // 出错后等待一秒再继续
                }
            }
            
            // 如果找到了购买按钮，前面已经返回了，不会执行到这里
            
            // 如果最终仍未检测到详情页，提示用户并退出
            if (!isInDetailPage) {
                updateStatus("多次尝试后未能检测到演出详情页，请手动检查页面", "#aa0000");
                toast("未能检测到演出详情页，请确保进入正确页面后再试");
                return;
            }
            
            // 已确认在详情页，开始搜索购买按钮
            updateStatus("确认在演出详情页，持续寻找购买按钮", "#00aa00");
            startBuyButtonMonitoring();
        } catch (e) {
            console.error("检查页面失败: " + e);
            sleep(1000); // 出错后等待一秒再继续
        }
    });
}

/**
 * 开始点击购买按钮
 */
function startBuyButtonClicking() {
    threads.start(function() {
        updateStatus("开始高频点击购买按钮...", "#00aa00");
        
        // 减少延迟，立即执行第一次点击
        var clicked = false;
        var attempts = 0;
        var maxAttempts = FENWANDAO_CONFIG.CLICK_CONFIG.MAX_ATTEMPTS;
        
        // 立即进行一次尝试
        try {
            console.log("立即尝试点击购买按钮...");
            // 立即购买按钮
            if (text("立即购买").exists()) {
                updateStatus("找到立即购买按钮，立即点击...");
                var buyBtn = text("立即购买").findOne(200);
                if (buyBtn) {
                    buyBtn.click();
                    console.log("立即购买按钮点击完成");
                } else {
                    click(FENWANDAO_CONFIG.COORDS.BUY_NOW_BTN.x, FENWANDAO_CONFIG.COORDS.BUY_NOW_BTN.y);
                    console.log("使用坐标点击立即购买按钮");
                }
                clicked = true;
            } 
            // 立即预定/预订按钮
            else if (text("立即预定").exists() || text("立即预订").exists()) {
                updateStatus("找到立即预订按钮，立即点击...");
                if (text("立即预定").exists()) {
                    var orderBtn = text("立即预定").findOne(200);
                    if (orderBtn) {
                        orderBtn.click();
                        console.log("立即预定按钮点击完成");
                    }
                } else {
                    var orderBtn2 = text("立即预订").findOne(200);
                    if (orderBtn2) {
                        orderBtn2.click();
                        console.log("立即预订按钮点击完成");
                    }
                }
                if (!orderBtn && !orderBtn2) {
                    click(FENWANDAO_CONFIG.COORDS.BUY_NOW_BTN.x, FENWANDAO_CONFIG.COORDS.BUY_NOW_BTN.y);
                    console.log("使用坐标点击立即预订按钮");
                }
                clicked = true;
            } 
            // 特惠购票按钮
            else if (text("特惠购票").exists()) {
                updateStatus("找到特惠购票按钮，立即点击...");
                var specialBtn = text("特惠购票").findOne(200);
                if (specialBtn) {
                    specialBtn.click();
                    console.log("特惠购票按钮点击完成");
                } else {
                    click(FENWANDAO_CONFIG.COORDS.BUY_NOW_BTN.x, FENWANDAO_CONFIG.COORDS.BUY_NOW_BTN.y);
                    console.log("使用坐标点击特惠购票按钮");
                }
                clicked = true;
            } 
            // 使用坐标点击
            else {
                updateStatus("未找到购买按钮文本，使用坐标点击");
                click(FENWANDAO_CONFIG.COORDS.BUY_NOW_BTN.x, FENWANDAO_CONFIG.COORDS.BUY_NOW_BTN.y);
                console.log("使用坐标点击可能的购买按钮位置");
            }
            
            // 极短暂等待，让UI响应
            sleep(20);
            
            // 立即检查是否需要点击确认按钮
            checkAndClickConfirmButton();
        } catch (e) {
            console.error("立即点击尝试失败: " + e);
        }
        
        // 只有在第一次点击不成功时，才进入循环尝试
        if (!clicked) {
            while (!clicked && attempts < maxAttempts) {
                attempts++;
                
                try {
                    // 尝试通过文本查找按钮，但跳过"预约抢票"和"组队抢票"按钮
                    if (text("立即购买").exists()) {
                        updateStatus("找到立即购买按钮，点击中...");
                        text("立即购买").findOne(100).click();
                        clicked = true;
                    } else if (text("立即预定").exists() || text("立即预订").exists()) {
                        updateStatus("找到立即预订按钮，点击中...");
                        text("立即预定").exists() ? text("立即预定").findOne(100).click() : text("立即预订").findOne(100).click();
                        clicked = true;
                    } else if (text("确认选择").exists()) {
                        updateStatus("找到确认选择按钮，点击中...");
                        text("确认选择").findOne(100).click();
                        clicked = true;
                    } else if (text("特惠购票").exists()) {
                        updateStatus("找到特惠购票按钮，点击中...");
                        text("特惠购票").findOne(100).click();
                        clicked = true;
                    } else {
                        // 尝试使用坐标点击
                        var message = "未找到购买按钮文本，尝试使用坐标点击";
                        // 每20次才更新一次状态，减少UI更新开销
                        if (attempts % 20 === 0) {
                            updateStatus(message + " (尝试 " + attempts + ")");
                        }
                        click(FENWANDAO_CONFIG.COORDS.BUY_NOW_BTN.x, FENWANDAO_CONFIG.COORDS.BUY_NOW_BTN.y);
                    }
                    
                    // 极短等待
                    sleep(FENWANDAO_CONFIG.CLICK_CONFIG.INTERVAL);
                    
                    // 每次点击后立即检查确认按钮
                    if (checkAndClickConfirmButton()) {
                        clicked = true;
                        break;
                    }
                } catch (e) {
                    console.error("点击循环中出错: " + e);
                    // 继续尝试下一次点击
                }
                
                // 检查是否已经进入了选择页面
                if (attempts % 10 === 0 && (text("选择场次").exists() || text("选择票品").exists() || text("提交订单").exists())) {
                    updateStatus("已进入选择页面", "#00aa00");
                    selectTicketAndConfirm();
                    break;
                }
            }
        }
        
        if (!clicked && attempts >= maxAttempts) {
            updateStatus("点击购买按钮失败，已达到最大尝试次数", "#aa0000");
            // 仍然尝试进行下一步
            selectTicketAndConfirm();
        }
    });
}

/**
 * 检查并点击确认按钮
 * @returns {boolean} 是否找到并点击了确认按钮
 */
function checkAndClickConfirmButton() {
    try {
        console.log("检查确认按钮...");
        
        // 检查各种可能的确认按钮
        if (text("确认").exists()) {
            console.log("找到确认按钮(text)，立即点击");
            text("确认").findOne(500).click();
            return true;
        } 
        else if (desc("确认").exists()) {
            console.log("找到确认按钮(desc)，立即点击");
            desc("确认").findOne(500).click();
            return true;
        }
        else if (textContains("确认").exists() && !textContains("确认并支付").exists()) {
            console.log("找到包含确认的按钮(textContains)，立即点击");
            textContains("确认").findOne(500).click();
            return true;
        }
        else if (descContains("确认").exists() && !descContains("确认并支付").exists()) {
            console.log("找到包含确认的按钮(descContains)，立即点击");
            descContains("确认").findOne(500).click();
            return true;
        }
        else if (className("android.widget.Button").text("确认").exists()) {
            console.log("找到确认按钮(Button+text)，立即点击");
            className("android.widget.Button").text("确认").findOne(500).click();
            return true;
        }
        else if (className("android.widget.Button").desc("确认").exists()) {
            console.log("找到确认按钮(Button+desc)，立即点击");
            className("android.widget.Button").desc("确认").findOne(500).click();
            return true;
        }
        
        // 如果没有找到具体的控件，尝试使用坐标点击
        console.log("未找到确认按钮控件，尝试使用坐标点击");
        click(FENWANDAO_CONFIG.COORDS.CONFIRM_BTN.x, FENWANDAO_CONFIG.COORDS.CONFIRM_BTN.y);
        
        // 再次检查是否已进入下一步
        sleep(100);
        if (text("选择场次").exists() || text("选择票品").exists() || text("提交订单").exists()) {
            console.log("坐标点击确认按钮后已进入下一页面");
            return true;
        }
        
        return false;
    } catch (e) {
        console.error("检查确认按钮时出错: " + e);
        return false;
    }
}

/**
 * 选择票品并确认
 */
function selectTicketAndConfirm() {
    threads.start(function() {
        try {
            updateStatus("开始选择票品...");
            
            // 获取用户选择的票价
            var selectedPrice = ui.priceSpinner.getSelectedItem().toString();
            var priceFound = false;
            
            // 立即尝试点击确认按钮（因为有时候会直接跳到确认页面）
            if (checkAndClickConfirmButton()) {
                console.log("已直接点击确认按钮");
                // 点击成功后，立即进入下一步
                submitFenwandaoOrder();
                return;
            }
            
            // 根据用户选择确定票价优先级
            var priorities = [];
            if (selectedPrice === "任意可用票价") {
                priorities = FENWANDAO_CONFIG.PRICE_PRIORITIES;
            } else {
                priorities = [selectedPrice];
                // 添加其他票价作为备选
                for (var i = 0; i < FENWANDAO_CONFIG.PRICE_PRIORITIES.length; i++) {
                    if (FENWANDAO_CONFIG.PRICE_PRIORITIES[i] !== selectedPrice) {
                        priorities.push(FENWANDAO_CONFIG.PRICE_PRIORITIES[i]);
                    }
                }
            }
            
            // 快速尝试直接多次点击票价位置
            console.log("尝试直接点击票价位置...");
            click(FENWANDAO_CONFIG.COORDS.TICKET_SELECT.x, FENWANDAO_CONFIG.COORDS.TICKET_SELECT.y);
            sleep(30);
            
            // 再次尝试点击确认按钮
            if (checkAndClickConfirmButton()) {
                console.log("票价点击后已找到确认按钮");
                submitFenwandaoOrder();
                return;
            }
            
            // 尝试按优先级选择票价
            for (var i = 0; i < priorities.length && !priceFound; i++) {
                var price = priorities[i];
                updateStatus("尝试选择票价: " + price);
                
                // 尝试多种方式查找票价
                if (text(price).exists()) {
                    try {
                        console.log("找到票价文本: " + price);
                        text(price).findOne(500).click();
                        priceFound = true;
                    } catch (e) {
                        console.error("点击票价文本失败: " + e);
                    }
                } else if (textContains(price).exists()) {
                    try {
                        console.log("找到包含票价的文本: " + price);
                        textContains(price).findOne(500).click();
                        priceFound = true;
                    } catch (e) {
                        console.error("点击包含票价的文本失败: " + e);
                    }
                } else if (descContains(price).exists()) {
                    try {
                        console.log("找到包含票价的描述: " + price);
                        descContains(price).findOne(500).click();
                        priceFound = true;
                    } catch (e) {
                        console.error("点击包含票价的描述失败: " + e);
                    }
                }
                
                if (priceFound) {
                    updateStatus("已选择票价: " + price, "#00aa00");
                    break;
                }
            }
            
            if (!priceFound) {
                updateStatus("未找到可选票价，直接点击预设坐标", "#ffaa00");
                // 多次尝试点击，提高成功率
                for (var j = 0; j < 3; j++) {
                    click(FENWANDAO_CONFIG.COORDS.TICKET_SELECT.x, FENWANDAO_CONFIG.COORDS.TICKET_SELECT.y);
                    sleep(20);
                }
            }
            
            // 极短等待让UI响应
            sleep(30);
            
            // 多次尝试点击确认按钮
            var confirmClicked = false;
            for (var k = 0; k < 5; k++) {
                if (checkAndClickConfirmButton()) {
                    confirmClicked = true;
                    break;
                }
                // 尝试点击预设坐标
                click(FENWANDAO_CONFIG.COORDS.CONFIRM_BTN.x, FENWANDAO_CONFIG.COORDS.CONFIRM_BTN.y);
                sleep(30);
            }
            
            if (!confirmClicked) {
                // 如果未能点击确认按钮，直接使用坐标多次点击
                updateStatus("未找到确认按钮，使用坐标多次点击", "#ffaa00");
                for (var l = 0; l < 5; l++) {
                    click(FENWANDAO_CONFIG.COORDS.CONFIRM_BTN.x, FENWANDAO_CONFIG.COORDS.CONFIRM_BTN.y);
                    sleep(30);
                }
            }
            
            // 检查是否已经进入下一页面
            sleep(50);
            if (text("提交订单").exists() || descContains("提交订单").exists() || textContains("提交订单").exists()) {
                updateStatus("已进入提交订单页面", "#00aa00");
            }
            
            // 立即开始提交订单，不延迟
            submitFenwandaoOrder();
            
        } catch (e) {
            updateStatus("选择票品过程出错: " + e.message, "#aa0000");
            console.error("选择票品过程出错: " + e);
            // 错误恢复：尝试继续下一步
            submitFenwandaoOrder();
        }
    });
}

/**
 * 提交纷玩岛订单
 */
function submitFenwandaoOrder() {
    // 使用线程执行提交订单，避免在UI线程执行手势
    threads.start(function() {
        try {
            updateStatus("开始提交订单...");
            
            var maxAttempts = FENWANDAO_CONFIG.CLICK_CONFIG.MAX_ATTEMPTS * 2; // 增加提交订单阶段的尝试次数
            var attempts = 0;
            var orderSubmitted = false;
            
            // 设置更短的点击间隔
            var clickInterval = Math.max(1, FENWANDAO_CONFIG.CLICK_CONFIG.INTERVAL / 4); // 点击间隔缩短到四分之一，但不少于1ms
            
            // 立即尝试点击
            try {
                console.log("立即尝试点击提交订单按钮...");
                
                // 尝试各种可能的提交订单按钮
                if (text("一键抢票").exists()) {
                    console.log("找到一键抢票按钮，立即点击");
                    text("一键抢票").findOne(300).click();
                    orderSubmitted = true;
                } else if (text("提交订单").exists()) {
                    console.log("找到提交订单按钮，立即点击");
                    text("提交订单").findOne(300).click();
                    orderSubmitted = true;
                } else if (descContains("提交").exists()) {
                    console.log("找到提交按钮描述，立即点击");
                    descContains("提交").findOne(300).click();
                    orderSubmitted = true;
                } else if (textContains("提交").exists()) {
                    console.log("找到提交按钮文本，立即点击");
                    textContains("提交").findOne(300).click();
                    orderSubmitted = true;
                } else if (className("android.widget.Button").text("提交订单").exists()) {
                    console.log("找到提交订单按钮(Button+text)，立即点击");
                    className("android.widget.Button").text("提交订单").findOne(300).click();
                    orderSubmitted = true;
                } else if (className("android.widget.Button").desc("提交订单").exists()) {
                    console.log("找到提交订单按钮(Button+desc)，立即点击");
                    className("android.widget.Button").desc("提交订单").findOne(300).click();
                    orderSubmitted = true;
                } else {
                    // 尝试坐标点击
                    console.log("未找到提交订单按钮，使用坐标点击");
                    click(FENWANDAO_CONFIG.COORDS.ONE_CLICK_BUY.x, FENWANDAO_CONFIG.COORDS.ONE_CLICK_BUY.y);
                }
                
                // 极短等待
                sleep(30);
                
                // 检查是否进入支付页面
                if (text("确认支付").exists() || text("确认付款").exists() || 
                    descContains("确认支付").exists() || descContains("确认付款").exists()) {
                    console.log("已进入支付页面，立即确认支付");
                    updateStatus("已进入支付页面", "#00aa00");
                    confirmPayment();
                    return;
                }
            } catch (e) {
                console.error("立即点击提交订单尝试失败: " + e);
            }
            
            // 如果第一次点击不成功，进入密集点击模式
            while (attempts < maxAttempts && !orderSubmitted) {
                attempts++;
                
                try {
                    // 尝试点击"一键抢票"或"提交订单"按钮
                    if (text("一键抢票").exists()) {
                        text("一键抢票").findOne(300).click();
                    } else if (text("提交订单").exists()) {
                        text("提交订单").findOne(300).click();
                    } else if (descContains("提交").exists()) {
                        descContains("提交").findOne(300).click();
                    } else if (textContains("提交").exists() && !textContains("提交评价").exists()) {
                        textContains("提交").findOne(300).click();
                    } else {
                        click(FENWANDAO_CONFIG.COORDS.ONE_CLICK_BUY.x, FENWANDAO_CONFIG.COORDS.ONE_CLICK_BUY.y);
                    }
                } catch (e) {
                    console.error("循环点击提交订单时出错: " + e);
                    // 继续尝试
                }
                
                // 最小化等待时间
                sleep(clickInterval);
                
                // 检查是否进入支付页面
                if (text("确认支付").exists() || text("确认付款").exists() || 
                    descContains("确认支付").exists() || descContains("确认付款").exists()) {
                    updateStatus("已进入支付页面", "#00aa00");
                    confirmPayment();
                    orderSubmitted = true;
                    break;
                }
                
                // 点击"确认"按钮（如果出现）
                try {
                    if (text("确认").exists()) {
                        text("确认").findOne(300).click();
                    } else if (desc("确认").exists()) {
                        desc("确认").findOne(300).click();
                    }
                } catch (e) {
                    // 忽略错误，继续尝试
                }
                
                // 减少日志更新频率以提高速度
                if (attempts % 20 === 0) {
                    updateStatus("提交订单尝试: " + attempts + "/" + maxAttempts);
                }
            }
            
            if (!orderSubmitted) {
                updateStatus("提交订单失败，达到最大尝试次数", "#aa0000");
                // 尝试直接确认支付，有时提交成功但未检测到
                confirmPayment();
            }
        } catch (e) {
            updateStatus("提交订单过程出错: " + e.message, "#aa0000");
            console.error("提交订单过程出错: " + e);
            // 尝试恢复，直接进入支付确认
            confirmPayment();
        }
    });
}

/**
 * 确认支付
 */
function confirmPayment() {
    threads.start(function() {
        try {
            updateStatus("开始确认支付...", "#00aa00");
            
            var maxAttempts = FENWANDAO_CONFIG.CLICK_CONFIG.MAX_ATTEMPTS * 2; // 增加支付确认阶段的尝试次数
            var attempts = 0;
            var paymentConfirmed = false;
            
            // 设置更短的点击间隔
            var clickInterval = Math.max(1, FENWANDAO_CONFIG.CLICK_CONFIG.INTERVAL / 4); // 点击间隔缩短到四分之一，但不少于1ms
            
            toast("即将确认支付，到手！");
            
            // 立即尝试点击
            try {
                console.log("立即尝试点击确认支付按钮...");
                
                // 尝试多种方式查找确认支付按钮
                if (text("确认支付").exists()) {
                    console.log("找到确认支付按钮(text)，立即点击");
                    text("确认支付").findOne(300).click();
                    paymentConfirmed = true;
                } else if (text("确认付款").exists()) {
                    console.log("找到确认付款按钮(text)，立即点击");
                    text("确认付款").findOne(300).click();
                    paymentConfirmed = true;
                } else if (descContains("确认支付").exists()) {
                    console.log("找到确认支付按钮(descContains)，立即点击");
                    descContains("确认支付").findOne(300).click();
                    paymentConfirmed = true;
                } else if (descContains("确认付款").exists()) {
                    console.log("找到确认付款按钮(descContains)，立即点击");
                    descContains("确认付款").findOne(300).click();
                    paymentConfirmed = true;
                } else if (text("立即付款").exists()) {
                    console.log("找到立即付款按钮(text)，立即点击");
                    text("立即付款").findOne(300).click();
                    paymentConfirmed = true;
                } else if (className("android.widget.Button").textContains("支付").exists()) {
                    console.log("找到支付按钮(Button+textContains)，立即点击");
                    className("android.widget.Button").textContains("支付").findOne(300).click();
                    paymentConfirmed = true;
                } else if (className("android.widget.Button").textContains("付款").exists()) {
                    console.log("找到付款按钮(Button+textContains)，立即点击");
                    className("android.widget.Button").textContains("付款").findOne(300).click();
                    paymentConfirmed = true;
                } else {
                    // 使用坐标点击
                    console.log("未找到确认支付按钮，使用坐标点击");
                    click(FENWANDAO_CONFIG.COORDS.CONFIRM_PAY.x, FENWANDAO_CONFIG.COORDS.CONFIRM_PAY.y);
                }
                
                // 极短等待
                sleep(30);
                
                // 检查是否支付成功
                if (text("支付成功").exists() || text("订单详情").exists() || 
                    descContains("支付成功").exists() || descContains("订单详情").exists()) {
                    updateStatus("抢票成功！支付完成", "#00aa00");
                    toast("抢票成功！支付完成");
                    
                    // 播放提示音，通知用户抢票成功
                    try {
                        device.vibrate(1000); // 震动提示
                        // 尝试播放系统提示音
                        media.playMusic("system/media/audio/notifications/Popcorn.ogg");
                    } catch (e) {
                        console.log("播放提示音失败: " + e);
                    }
                    
                    return;
                }
            } catch (e) {
                console.error("立即点击确认支付尝试失败: " + e);
            }
            
            // 如果第一次点击不成功，进入密集点击模式
            while (attempts < maxAttempts && !paymentConfirmed) {
                attempts++;
                
                try {
                    // 尝试多种方式点击"确认支付"或"确认付款"按钮
                    if (text("确认支付").exists()) {
                        text("确认支付").findOne(300).click();
                    } else if (text("确认付款").exists()) {
                        text("确认付款").findOne(300).click();
                    } else if (descContains("确认支付").exists()) {
                        descContains("确认支付").findOne(300).click();
                    } else if (descContains("确认付款").exists()) {
                        descContains("确认付款").findOne(300).click();
                    } else if (text("立即付款").exists()) {
                        text("立即付款").findOne(300).click();
                    } else {
                        click(FENWANDAO_CONFIG.COORDS.CONFIRM_PAY.x, FENWANDAO_CONFIG.COORDS.CONFIRM_PAY.y);
                    }
                } catch (e) {
                    console.error("循环点击确认支付时出错: " + e);
                    // 继续尝试
                }
                
                // 最小化等待时间
                sleep(clickInterval);
                
                // 检查是否支付成功
                if (text("支付成功").exists() || text("订单详情").exists() || 
                    descContains("支付成功").exists() || descContains("订单详情").exists()) {
                    updateStatus("抢票成功！支付完成", "#00aa00");
                    toast("抢票成功！支付完成");
                    paymentConfirmed = true;
                    
                    // 播放提示音，通知用户抢票成功
                    try {
                        device.vibrate(1000); // 震动提示
                        // 尝试播放系统提示音
                        media.playMusic("system/media/audio/notifications/Popcorn.ogg");
                    } catch (e) {
                        console.log("播放提示音失败: " + e);
                    }
                    
                    break;
                }
                
                // 减少日志更新频率
                if (attempts % 20 === 0) {
                    updateStatus("已点击确认支付" + attempts + "次，继续尝试...");
                }
            }
            
            if (!paymentConfirmed) {
                updateStatus("支付环节可能需要手动操作，请留意屏幕提示", "#ffaa00");
                toast("请手动完成支付");
            }
        } catch (e) {
            updateStatus("确认支付过程出错: " + e.message, "#aa0000");
            console.error("确认支付过程出错: " + e);
        }
    });
}

/**
 * 直接点击立即购买按钮（位于截图中右侧的按钮）
 * 这个函数用于避免脚本卡住的情况
 */
function clickBuyNowButton() {
    threads.start(function() {
        try {
            console.log("尝试直接点击立即购买按钮...");
            updateStatus("尝试点击立即购买按钮...", "#ffaa00");
            
            // 检查是否已经有购买按钮（文本匹配）
            if (text("立即购买").exists()) {
                console.log("找到立即购买按钮文本，直接点击");
                text("立即购买").findOne().click();
                updateStatus("已点击立即购买按钮", "#00aa00");
                sleep(50); // 极短等待
                startBuyButtonClicking();
                return;
            } 
            else if (text("立即预定").exists() || text("立即预订").exists()) {
                console.log("找到立即预订按钮文本，直接点击");
                text("立即预定").exists() ? text("立即预定").findOne().click() : text("立即预订").findOne().click();
                updateStatus("已点击立即预订按钮", "#00aa00");
                sleep(50); // 极短等待
                startBuyButtonClicking();
                return;
            }
            else if (text("特惠购票").exists()) {
                console.log("找到特惠购票按钮文本，直接点击");
                text("特惠购票").findOne().click();
                updateStatus("已点击特惠购票按钮", "#00aa00");
                sleep(50); // 极短等待
                startBuyButtonClicking();
                return;
            }
            
            // 没有找到文本，尝试点击截图中右侧立即购买按钮的位置
            console.log("未找到购买按钮文本，开始高频点击右侧立即购买按钮位置");
            var buyBtnX = device.width * 0.75; // 屏幕75%位置，右侧按钮
            var buyBtnY = device.height * 0.92; // 屏幕92%位置，底部
            
            // 高频点击右侧立即购买按钮位置（连续点击20次）
            for (var i = 0; i < 20; i++) {
                click(buyBtnX, buyBtnY);
                sleep(10); // 极短延迟
                
                // 每5次检查一下是否已经出现购买按钮
                if (i % 5 === 0 && (text("立即购买").exists() || text("立即预订").exists() || text("立即预定").exists() || text("特惠购票").exists())) {
                    console.log("高频点击后检测到购买按钮，继续点击");
                    updateStatus("检测到购买按钮，继续点击", "#00aa00");
                    startBuyButtonClicking();
                    return;
                }
            }
            
            // 按顺序尝试点击屏幕底部多个位置，但仅限右侧区域（立即购买按钮区域）
            console.log("尝试点击屏幕底部右侧区域");
            for (var i = 0.5; i <= 0.9; i += 0.1) {
                click(device.width * i, device.height * 0.92);
                sleep(20);
                if (text("立即购买").exists() || text("立即预订").exists() || text("立即预定").exists() || text("特惠购票").exists()) {
                    console.log("点击位置 " + i + " 后检测到购买按钮，继续点击");
                    updateStatus("检测到购买按钮，继续点击", "#00aa00");
                    startBuyButtonClicking();
                    return;
                }
            }
            
            // 如果上述方法都未成功，开始持续高频监测
            console.log("未通过直接点击找到购买按钮，开始持续高频监测");
            updateStatus("开始持续高频监测购买按钮...", "#ffaa00");
            startBuyButtonMonitoring();
        } catch (e) {
            console.error("点击立即购买按钮失败: " + e);
            updateStatus("点击失败，开始持续监测", "#ffaa00");
            // 即使失败也开始监测
            startBuyButtonMonitoring();
        }
    });
}

/**
 * 开始纷玩岛抢票流程
 */
function startFenwandaoTicketGrabbing() {
    var isDebug = ui.debugModeCheck.checked;
    var timeInput = ui.timeInput.text();
    
    if (!timeInput || timeInput.trim() === '') {
        updateStatus("请输入抢票时间", "#aa0000");
        return;
    }
    
    // 检查是否在纷玩岛应用中
    if (!isDebug && !app.getAppName(currentPackage()) || app.getAppName(currentPackage()).indexOf("纷玩") < 0) {
        updateStatus("请先手动打开纷玩岛应用并进入演出页面", "#aa0000");
        toast("请先手动打开纷玩岛应用并进入演出页面");
        return;
    }
    
    // 首先检查是否已经有购买按钮出现
    if (text("立即购买").exists() || text("立即预订").exists() || text("立即预定").exists() || text("特惠购票").exists()) {
        console.log("检测到购买按钮，立即开始点击");
        updateStatus("检测到购买按钮，立即开始点击", "#00aa00");
        toast("检测到购买按钮，立即开始点击");
        startBuyButtonClicking();
        return; // 如果已经有购买按钮，直接执行点击
    }
    
    // 立即检查是否有组队抢票按钮，将其作为确认已进入详情页的标志
    if (text("组队抢票").exists() || descContains("组队抢票").exists() || 
        className("android.widget.Button").desc("组队抢票").exists()) {
        
        console.log("检测到组队抢票按钮，确认已进入演出详情页");
        updateStatus("确认已进入演出详情页，尝试点击立即购买按钮", "#00aa00");
        toast("已确认在演出详情页，尝试点击立即购买按钮");
        
        // 直接尝试点击立即购买按钮
        clickBuyNowButton();
        
    } else {
        // 如果没有找到组队抢票按钮，提示用户
        console.log("未检测到组队抢票按钮，可能未进入演出详情页");
        updateStatus("未检测到组队抢票按钮，请确保在正确页面", "#ffaa00");
        toast("请确保已进入演出详情页，系统将持续检测页面状态");
    }
    
    // 解析时间
    var targetTime;
    try {
        // 处理格式: MM-DD HH:mm:ss
        var parts = timeInput.split(' ');
        var dateParts = parts[0].split('-');
        var timeParts = parts[1].split(':');
        
        var now = new Date();
        var year = now.getFullYear();
        var month = parseInt(dateParts[0]) - 1; // 月份从0开始
        var day = parseInt(dateParts[1]);
        var hour = parseInt(timeParts[0]);
        var minute = parseInt(timeParts[1]);
        var second = timeParts.length > 2 ? parseInt(timeParts[2]) : 0;
        
        targetTime = new Date(year, month, day, hour, minute, second).getTime();
    } catch (e) {
        updateStatus("时间格式错误，请使用MM-DD HH:mm:ss格式", "#aa0000");
        return;
    }
    
    updateStatus("开始准备抢票，目标时间: " + new Date(targetTime).toLocaleString(), "#00aa00");
    toast("抢票已启动，目标时间: " + new Date(targetTime).toLocaleString());
    console.log("抢票已启动，目标时间: " + new Date(targetTime).toLocaleString());
    
    // 如果是调试模式，直接从当前时间开始
    if (isDebug) {
        targetTime = new Date().getTime();
        updateStatus("调试模式：立即开始抢票流程", "#0000aa");
    }
    
    // 等待开售并开始抢票
    waitForSaleStart(targetTime);
}

/**
 * 显示调试信息，包括当前识别到的按钮和点击位置
 * @param {boolean} isDebug - 是否为调试模式
 */
function showDebugInfo(isDebug) {
    if (!isDebug) return;
    
    // 使用线程定期显示控件信息，便于调试
    threads.start(function() {
        try {
            var foundButtons = [];
            
            // 检测预约抢票控件
            if (className("android.view.View").desc("预约抢票").exists()) {
                foundButtons.push("预约抢票(View+desc)");
            }
            
            if (className("android.view.View").desc("组队抢票").exists()) {
                foundButtons.push("组队抢票(View+desc)");
            }
            
            // 检测Button类型的组队抢票控件
            if (className("android.widget.Button").desc("组队抢票").exists()) {
                foundButtons.push("组队抢票(Button+desc)");
                
                // 获取控件详细信息
                var teamButton = className("android.widget.Button").desc("组队抢票").findOne(1000);
                if (teamButton) {
                    console.log("组队抢票按钮信息: { " +
                        "bounds: [" + teamButton.bounds().left + ", " + teamButton.bounds().top + ", " + 
                        teamButton.bounds().right + ", " + teamButton.bounds().bottom + "], " +
                        "clickable: " + teamButton.clickable() + ", " +
                        "desc: '" + teamButton.desc() + "'" +
                    " }");
                }
            }
            
            // 检测Button类型的预约抢票控件
            if (className("android.widget.Button").desc("预约抢票").exists()) {
                foundButtons.push("预约抢票(Button+desc)");
            }
            
            // 检测文本控件
            if (text("预约抢票").exists()) {
                foundButtons.push("预约抢票(text)");
            }
            
            if (text("组队抢票").exists()) {
                foundButtons.push("组队抢票(text)");
            }
            
            if (className("android.widget.Button").textContains("预约").exists()) {
                foundButtons.push("预约按钮");
            }
            
            if (className("android.widget.Button").textContains("组队").exists()) {
                foundButtons.push("组队按钮");
            }
            
            // 检测其他按钮
            if (text("立即购买").exists()) foundButtons.push("立即购买");
            if (text("立即预定").exists() || text("立即预订").exists()) foundButtons.push("立即预订");
            if (text("确认选择").exists()) foundButtons.push("确认选择");
            if (text("特惠购票").exists()) foundButtons.push("特惠购票");
            
            if (foundButtons.length > 0) {
                console.log("在当前页面找到以下按钮: " + foundButtons.join(", "));
                updateStatus("找到按钮: " + foundButtons.join(", "), "#00aa00");
                
                // 按优先级尝试点击控件
                var buttonClicked = false;
                
                // 优先点击立即购买等按钮
                if (!buttonClicked && (text("立即购买").exists() || text("立即预定").exists() || 
                    text("立即预订").exists() || text("特惠购票").exists())) {
                    updateStatus("检测到可购买按钮，开始抢票", "#00aa00");
                    buttonClicked = true;
                }
            } else {
                console.log("未在当前页面找到任何预期按钮");
                updateStatus("未找到预期的按钮，继续监测", "#ffaa00");
            }
        } catch (e) {
            console.error("显示调试信息出错: " + e);
        }
    });
}

/**
 * 基于坐标的强制点击方法，应对无法识别控件的情况
 * @param {number} x - 横坐标
 * @param {number} y - 纵坐标
 * @param {string} actionName - 操作名称，用于日志
 */
function forceTap(x, y, actionName) {
    actionName = actionName || "点击操作";
    console.log("执行强制" + actionName + ": (" + x + ", " + y + ")");
    
    // 尝试使用不同的点击方法
    try {
        // 方法1: 普通click
        click(x, y);
        console.log("使用普通click方法执行" + actionName);
    } catch(e) {
        console.log("普通click方法失败: " + e);
        
        try {
            // 方法2: 使用Tap手势
            press(x, y, 50);
            console.log("使用press方法执行" + actionName);
        } catch(e2) {
            console.log("press方法失败: " + e2);
            
            try {
                // 方法3: 使用触摸事件
                var ra = new RootAutomator();
                ra.tap(x, y);
                ra.exit();
                console.log("使用RootAutomator方法执行" + actionName);
            } catch(e3) {
                console.log("RootAutomator方法失败: " + e3);
                
                // 最后尝试使用shell命令执行点击
                try {
                    shell("input tap " + x + " " + y, true);
                    console.log("使用shell命令执行" + actionName);
                } catch(e4) {
                    console.log("所有点击方法都失败: " + e4);
                    updateStatus(actionName + "失败，请手动操作", "#aa0000");
                }
            }
        }
    }
}

/**
 * 针对纷玩岛的页面特点，使用强制点击方式处理点击操作
 */
function specialFenwandaoClick() {
    // 使用线程执行点击操作，避免在UI线程执行手势
    threads.start(function() {
        try {
            updateStatus("开始执行特殊点击...");
            console.log("执行纷玩岛特殊点击策略");
            
            // 先截图分析页面
            if (requestScreenCapture()) {
                sleep(1000);
                var img = captureScreen();
                if (img) {
                    // 分析图片中可能的按钮区域
                    // 这部分需要图像识别算法支持，简化处理
                    console.log("已获取屏幕截图，尺寸: " + img.getWidth() + "x" + img.getHeight());
                    
                    // 释放图片
                    img.recycle();
                }
            }
            
            // 记录当前页面的文本分布
            var pageTexts = [];
            textMatches(/.+/).find().forEach(function(t) {
                pageTexts.push({
                    text: t.text(),
                    bounds: t.bounds(),
                    clickable: t.clickable()
                });
                console.log("文本: " + t.text() + " 位置: (" + 
                    t.bounds().centerX() + "," + t.bounds().centerY() + ")" + 
                    (t.clickable() ? " [可点击]" : ""));
            });
            
            // 强制点击预设的坐标位置
            updateStatus("执行强制点击...");
            forceTap(747, 2252, "预约抢票");
            
            // 等待一段时间观察结果
            sleep(1000);
            
            // 检查页面是否有变化
            var newTexts = [];
            textMatches(/.+/).find().forEach(function(t) {
                newTexts.push(t.text());
            });
            
            // 比较点击前后页面变化
            var changed = false;
            if (newTexts.length != pageTexts.length) {
                changed = true;
            } else {
                for (var i = 0; i < newTexts.length; i++) {
                    if (!pageTexts.some(function(item) { return item.text === newTexts[i]; })) {
                        changed = true;
                        break;
                    }
                }
            }
            
            if (changed) {
                updateStatus("页面已变化，点击可能成功", "#00aa00");
            } else {
                updateStatus("页面无变化，尝试再次点击", "#ffaa00");
                // 尝试其他坐标点
                for (var i = 0; i < TEST_COORDS.length; i++) {
                    forceTap(TEST_COORDS[i].x, TEST_COORDS[i].y, "测试点击 #" + (i+1));
                    sleep(500);
                    
                    // 简单检查页面变化
                    var afterClickTexts = [];
                    textMatches(/.+/).find().forEach(function(t) {
                        afterClickTexts.push(t.text());
                    });
                    
                    if (afterClickTexts.length != newTexts.length) {
                        updateStatus("测试点 #" + (i+1) + " 点击后页面已变化", "#00aa00");
                        break;
                    }
                }
            }
            
        } catch (e) {
            updateStatus("特殊点击操作失败: " + e.message, "#aa0000");
            console.error("特殊点击操作失败: " + e);
        }
    });
}

// 设置特殊点击按钮的点击事件
ui.specialClickBtn.click(function() {
    updateStatus("开始执行特殊点击...");
    specialFenwandaoClick();
});

// 直接导出函数到全局空间
global.waitAndClickButton = waitAndClickButton;
global.performConfirmClick = performConfirmClick;
global.waitForAccessibility = waitForAccessibility;
global.launchApplication = launchApplication;
global.submitOrder = submitOrder;
global.DEFAULT_CONFIRM_COORDS = DEFAULT_CONFIRM_COORDS;
global.DEBUG_COORDS = DEBUG_COORDS;
global.TEST_COORDS = TEST_COORDS;
global.currentTestIndex = currentTestIndex;
global.updateStatus = updateStatus;
global.waitForSaleStart = waitForSaleStart;
global.startFenwandaoTicketGrabbing = startFenwandaoTicketGrabbing;
global.FENWANDAO_CONFIG = FENWANDAO_CONFIG;
global.startBuyButtonClicking = startBuyButtonClicking;
global.showDebugInfo = showDebugInfo;
global.isInBookingPage = isInBookingPage;
global.forceTap = forceTap;
global.specialFenwandaoClick = specialFenwandaoClick;
global.startBuyButtonMonitoring = startBuyButtonMonitoring;
global.clickBuyNowButton = clickBuyNowButton;

// 输出模块加载成功消息
console.log("自动化操作模块加载成功"); 

/**
 * 持续监测购买按钮出现
 */
function startBuyButtonMonitoring() {
    threads.start(function() {
        try {
            console.log("开始持续高频监测购买按钮出现...");
            updateStatus("持续高频监测购买按钮中...", "#ffaa00");
            
            // 立即尝试点击右侧的立即购买按钮
            console.log("尝试立即点击右侧立即购买按钮位置");
            var buyBtnX = device.width * 0.75; // 屏幕75%位置，右侧按钮
            var buyBtnY = device.height * 0.92; // 屏幕92%位置，底部
            
            // 连续快速点击10次
            for (var i = 0; i < 10; i++) {
                click(buyBtnX, buyBtnY);
                sleep(5); // 极短延迟
            }
            
            // 短暂等待后检查
            sleep(50);
            if (text("立即购买").exists() || text("立即预订").exists() || text("立即预定").exists() || text("特惠购票").exists()) {
                updateStatus("点击后找到购买按钮，开始点击", "#00aa00");
                startBuyButtonClicking();
                return;
            }
            
            // 定义重试计数和间隔
            var retryCount = 0;
            var maxRetries = 200000; // 设置一个非常大的值，实际上就是无限循环
            var checkInterval = 20; // 每20毫秒检测一次，大幅提高频率
            
            // 记录开始时间
            var startTime = new Date().getTime();
            
            // 创建一个循环检查是否出现了购买按钮
            while (retryCount < maxRetries) {
                retryCount++;
                
                try {
                    // 检查各种可能的购买按钮
                    if (text("立即购买").exists()) {
                        updateStatus("找到立即购买按钮！开始点击", "#00aa00");
                        console.log("在第 " + retryCount + " 次尝试时找到立即购买按钮");
                        
                        // 获取按钮位置并点击
                        var btn = text("立即购买").findOne(50);
                        if (btn) {
                            console.log("点击立即购买按钮控件");
                            btn.click();
                        } else {
                            console.log("使用坐标点击立即购买按钮");
                            click(buyBtnX, buyBtnY);
                        }
                        
                        sleep(5); // 极短等待
                        startBuyButtonClicking(); // 继续执行点击流程
                        return;
                    } else if (text("立即预定").exists() || text("立即预订").exists()) {
                        updateStatus("找到立即预订按钮！开始点击", "#00aa00");
                        console.log("在第 " + retryCount + " 次尝试时找到立即预订按钮");
                        
                        // 获取按钮位置并点击
                        var btn = text("立即预定").exists() ? 
                            text("立即预定").findOne(50) : 
                            text("立即预订").findOne(50);
                        
                        if (btn) {
                            console.log("点击立即预订按钮控件");
                            btn.click();
                        } else {
                            console.log("使用坐标点击立即预订按钮");
                            click(buyBtnX, buyBtnY);
                        }
                        
                        sleep(5); // 极短等待
                        startBuyButtonClicking(); // 继续执行点击流程
                        return;
                    } else if (text("特惠购票").exists()) {
                        updateStatus("找到特惠购票按钮！开始点击", "#00aa00");
                        console.log("在第 " + retryCount + " 次尝试时找到特惠购票按钮");
                        
                        // 获取按钮位置并点击
                        var btn = text("特惠购票").findOne(50);
                        if (btn) {
                            console.log("点击特惠购票按钮控件");
                            btn.click();
                        } else {
                            console.log("使用坐标点击特惠购票按钮");
                            click(buyBtnX, buyBtnY);
                        }
                        
                        sleep(5); // 极短等待
                        startBuyButtonClicking(); // 继续执行点击流程
                        return;
                    }
                    
                    // 每次检测都尝试点击一次可能的购买按钮位置，提高频率
                    click(buyBtnX, buyBtnY);
                    
                    // 定期更新状态，避免过多日志
                    if (retryCount % 200 === 0) {
                        var currentTime = new Date().getTime();
                        var elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
                        updateStatus("持续监测购买按钮... 已尝试 " + retryCount + " 次，已监测 " + elapsedSeconds + " 秒", "#ffaa00");
                        
                        // 每500次检测进行一次轻微刷新，防止页面卡住
                        if (retryCount % 500 === 0) {
                            console.log("执行轻微刷新和点击...");
                            try {
                                // 轻微下拉刷新
                                swipe(device.width / 2, device.height / 4, device.width / 2, device.height / 4 + 20, 50);
                                // 刷新后立即点击购买按钮位置
                                sleep(30);
                                click(buyBtnX, buyBtnY);
                                
                                // 检查是否点击成功
                                sleep(20);
                                if (text("立即购买").exists() || text("立即预订").exists() || text("立即预定").exists() || text("特惠购票").exists()) {
                                    updateStatus("刷新后找到购买按钮，开始点击", "#00aa00");
                                    startBuyButtonClicking();
                                    return;
                                }
                            } catch (e) {
                                console.log("刷新操作失败: " + e);
                            }
                        }
                        
                        // 每2000次检测提示用户并进行一次彻底刷新
                        if (retryCount % 2000 === 0) {
                            toast("仍在监测购买按钮，已监测 " + elapsedSeconds + " 秒");
                            
                            // 尝试更强的刷新方式
                            console.log("执行更强的刷新...");
                            try {
                                // 向下滑动刷新
                                swipe(device.width / 2, device.height / 3, device.width / 2, device.height * 2/3, 100);
                                sleep(100);
                                // 再向上滑动回来
                                swipe(device.width / 2, device.height * 2/3, device.width / 2, device.height / 3, 100);
                                sleep(50);
                                // 立即点击可能的按钮位置
                                click(buyBtnX, buyBtnY);
                            } catch (e) {
                                console.log("强刷新操作失败: " + e);
                            }
                        }
                    }
                    
                    // 等待一段时间再次检测，但不要等太久
                    sleep(checkInterval);
                } catch (e) {
                    console.error("检测购买按钮失败: " + e);
                    sleep(50); // 出错后稍微等待
                }
            }
            
            // 如果达到最大尝试次数仍未找到（实际上不会到达这里）
            updateStatus("多次尝试后未找到购买按钮，请检查页面状态", "#aa0000");
        } catch (e) {
            console.error("监测购买按钮线程出错: " + e);
            updateStatus("监测过程出现错误: " + e.message, "#aa0000");
        }
    });
}