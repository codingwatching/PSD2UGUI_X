// PSD2UGUI Quick Tag - 优化版
// 支持单个/多个图层添加标签 + 保持选择状态
// Author: sunsvip
// Version: 4.1
// Last Update: 2025-11-22

#target photoshop

// ==================== 配置区 ====================
var CONFIG = {
    "Image\n图片": ".img",
    "RawImage\n贴图": ".rimg",
    "Text\n文本": ".txt",
    "TMPText\nTMP文本": ".tmptxt",
    "Mask\n遮罩": ".msk",
    "FillColor\n纯色": ".col",
    "Background\n背景": ".bg",
    "Button\n按钮": ".bt",
    "TMPButton\nTMP按钮": ".tmpbt",
    "Button_Highlight\n按钮高亮": ".onover",
    "Button_Press\n按钮按下": ".press",
    "Button_Select\n按钮选中": ".select",
    "Button_Disable\n按钮禁用": ".disable",
    "Button_Text\n按钮文本": ".bttxt",
    "Dropdown\n下拉框": ".dpd",
    "TMPDropdown\nTMP下拉框": ".tmpdpd",
    "Dropdown_Label\n下拉框文本": ".dpdlb",
    "Dropdown_Arrow\n下拉框箭头": ".dpdicon",
    "InputField\n输入框": ".ipt",
    "TMPInputField\nTMP输入框": ".tmpipt",
    "InputField_Placeholder\n输入框提示文本": ".placeholder",
    "InputField_Text\n输入框内容文本": ".ipttxt",
    "Toggle\n勾选框": ".tg",
    "TMPToggle\nTMP勾选框": ".tmptg",
    "Toggle_Checkmark\n勾选框标记": ".mark",
    "Toggle_Label\n勾选框文本": ".tglb",
    "Slider\n进度条": ".sld",
    "Slider_Fill\n进度条填充图": ".fill",
    "Slider_Handle\n进度条滑块": ".handle",
    "ScrollView\n滚动列表": ".sv",
    "ScrollView_Viewport\n滚动列表视口": ".vpt",
    "ScrollView_HorizontalBarBG\n滚动列表水平滑动条背景": ".hbarbg",
    "ScrollView_HorizontalBar\n滚动列表水平滑动条滑块": ".hbar",
    "ScrollView_VerticalBarBG\n滚动列表垂直滑动条背景": ".vbarbg",
    "ScrollView_VerticalBar\n滚动列表垂直滑动条滑块": ".vbar"
};
// ===============================================

(function() {
    // 检查条件
    if (!app.documents.length) {
        alert("❌ 请先打开一个 PSD 文档");
        return;
    }

    var doc = app.activeDocument;
    
    if (!doc.activeLayer) {
        alert("❌ 请先选择一个图层");
        return;
    }

    // 保存当前选择状态
    var savedSelection = saveSelection();

    // 快速获取选中的图层信息
    var layerInfos = getSelectedLayerInfosFast();
    
    if (layerInfos.length === 0) {
        alert("❌ 请先选择一个或多个图层");
        return;
    }

    // 创建对话框
    var w = new Window("dialog", "PSD2UGUI - 快速标签");
    w.alignChildren = "fill";
    w.spacing = 12;
    w.margins = 16;

    // 显示选中的图层信息
    var infoPanel = w.add("panel", undefined, "选中的图层");
    infoPanel.alignChildren = "fill";
    infoPanel.margins = 10;

    if (layerInfos.length === 1) {
        var nameText = infoPanel.add("statictext", undefined, layerInfos[0].name);
        nameText.graphics.font = ScriptUI.newFont(nameText.graphics.font.name, ScriptUI.FontStyle.BOLD, 12);
        nameText.preferredSize.width = 250;

        var currentTags = getLayerTags(layerInfos[0].name);
        if (currentTags.length > 0) {
            var tagGroup = infoPanel.add("group");
            tagGroup.add("statictext", undefined, "已有: ");
            var tagsText = tagGroup.add("statictext", undefined, currentTags.join(" "));
            try {
                tagsText.graphics.foregroundColor = tagsText.graphics.newPen(
                    w.graphics.PenType.SOLID_COLOR, [0, 0.7, 0, 1], 1
                );
            } catch (e) {}
        }
    } else {
        var countText = infoPanel.add("statictext", undefined, "已选择 " + layerInfos.length + " 个图层");
        countText.graphics.font = ScriptUI.newFont(countText.graphics.font.name, ScriptUI.FontStyle.BOLD, 12);
        
        var listGroup = infoPanel.add("group");
        listGroup.orientation = "column";
        listGroup.alignChildren = "left";
        
        var displayCount = Math.min(layerInfos.length, 5);
        for (var i = 0; i < displayCount; i++) {
            var layerItem = listGroup.add("statictext", undefined, "  • " + layerInfos[i].name);
            layerItem.graphics.font = ScriptUI.newFont(layerItem.graphics.font.name, ScriptUI.FontStyle.REGULAR, 10);
        }
        
        if (layerInfos.length > 5) {
            var moreText = listGroup.add("statictext", undefined, "  ... 还有 " + (layerInfos.length - 5) + " 个");
            moreText.graphics.font = ScriptUI.newFont(moreText.graphics.font.name, ScriptUI.FontStyle.ITALIC, 10);
        }
    }

    w.add("panel", undefined, undefined, {borderStyle: "black"});

    // 标签按钮区域
    var tagsPanel = w.add("panel", undefined, "添加标签");
    tagsPanel.alignChildren = "fill";
    tagsPanel.margins = 10;

    var btnArea = tagsPanel.add("group");
    btnArea.orientation = "column";
    btnArea.alignChildren = "fill";
    btnArea.spacing = 6;

    var keys = [];
    for (var k in CONFIG) {
        if (CONFIG.hasOwnProperty(k)) {
            keys.push(k);
        }
    }

    var row = null;
    for (var i = 0; i < keys.length; i++) {
        if (i % 3 === 0) {
            row = btnArea.add("group");
            row.spacing = 6;
        }

        var key = keys[i];
        var suffix = CONFIG[key];
        
        var btn = row.add("button", undefined, suffix);
        btn.preferredSize = [80, 32];
        btn.helpTip = key;
        
        // 单选时禁用已有标签
        if (layerInfos.length === 1) {
            var currentTags = getLayerTags(layerInfos[0].name);
            if (arrayContains(currentTags, suffix)) {
                btn.text = "✓ " + btn.text;
                btn.enabled = false;
            }
        }

        btn.onClick = (function(s, infos, selection) {
            return function() {
                batchAddTagByInfo(infos, s);
                restoreSelection(selection);
                w.close();
            };
        })(suffix, layerInfos, savedSelection);
    }

    w.add("panel", undefined, undefined, {borderStyle: "black"});

    // 移除标签区域
    var removePanel = w.add("panel", undefined, "移除标签");
    removePanel.alignChildren = "fill";
    removePanel.margins = 10;

    var removeGroup = removePanel.add("group");
    removeGroup.spacing = 6;
    removeGroup.alignment = "center";

    if (layerInfos.length === 1) {
        // 单选模式
        var currentTags = getLayerTags(layerInfos[0].name);
        
        if (currentTags.length > 0) {
            var removeLastBtn = removeGroup.add("button", undefined, "移除最后 (" + currentTags[currentTags.length - 1] + ")");
            removeLastBtn.preferredSize = [140, 28];
            removeLastBtn.helpTip = "移除最后一个标签";
            removeLastBtn.onClick = function() {
                batchRemoveLastTagByInfo(layerInfos);
                restoreSelection(savedSelection);
                w.close();
            };
            
            var removeAllBtn = removeGroup.add("button", undefined, "移除全部");
            removeAllBtn.preferredSize = [90, 28];
            removeAllBtn.helpTip = "移除所有标签";
            removeAllBtn.onClick = function() {
                batchRemoveAllTagsByInfo(layerInfos);
                restoreSelection(savedSelection);
                w.close();
            };
        } else {
            var noTagText = removeGroup.add("statictext", undefined, "当前图层无标签");
            noTagText.graphics.font = ScriptUI.newFont(noTagText.graphics.font.name, ScriptUI.FontStyle.ITALIC, 11);
        }
    } else {
        // 多选模式
        var batchRemoveLastBtn = removeGroup.add("button", undefined, "批量移除最后标签");
        batchRemoveLastBtn.preferredSize = [140, 28];
        batchRemoveLastBtn.helpTip = "移除所有选中图层的最后一个标签";
        batchRemoveLastBtn.onClick = function() {
            batchRemoveLastTagByInfo(layerInfos);
            restoreSelection(savedSelection);
            w.close();
        };

        var batchRemoveAllBtn = removeGroup.add("button", undefined, "批量移除全部标签");
        batchRemoveAllBtn.preferredSize = [140, 28];
        batchRemoveAllBtn.helpTip = "移除所有选中图层的所有标签";
        batchRemoveAllBtn.onClick = function() {
            batchRemoveAllTagsByInfo(layerInfos);
            restoreSelection(savedSelection);
            w.close();
        };
    }

    w.add("panel", undefined, undefined, {borderStyle: "black"});

    // 底部按钮
    var bottomGroup = w.add("group");
    bottomGroup.alignment = "center";
    bottomGroup.spacing = 8;

    var cancelBtn = bottomGroup.add("button", undefined, "取消 (ESC)", {name: "cancel"});
    cancelBtn.preferredSize = [100, 28];

    // 提示
    var tipText = layerInfos.length === 1 ? 
        "💡 支持多标签，点击即可追加" : 
        "💡 批量模式 (" + layerInfos.length + " 个图层)";
    var tip = w.add("statictext", undefined, tipText);
    tip.graphics.font = ScriptUI.newFont(tip.graphics.font.name, ScriptUI.FontStyle.ITALIC, 10);

    // ==================== 核心函数 ====================

    // 批量处理上下文（避免重复保存/恢复选择导致变慢）
    var __batchContext = null;

    function beginBatchRename() {
        if (!__batchContext) {
            __batchContext = { selection: saveSelection() };
        }
    }

    function endBatchRename() {
        if (__batchContext) {
            restoreSelection(__batchContext.selection);
            __batchContext = null;
        }
    }

    // 保存当前选择状态
    function saveSelection() {
        var selection = {
            layerIDs: [],
            expandedGroups: []
        };
        
        try {
            // 保存选中的图层ID
            var ref = new ActionReference();
            ref.putProperty(charIDToTypeID('Prpr'), stringIDToTypeID('targetLayersIDs'));
            ref.putEnumerated(charIDToTypeID('Dcmn'), charIDToTypeID('Ordn'), charIDToTypeID('Trgt'));
            var desc = executeActionGet(ref);
            
            if (desc.hasKey(stringIDToTypeID('targetLayersIDs'))) {
                var list = desc.getList(stringIDToTypeID('targetLayersIDs'));
                for (var i = 0; i < list.count; i++) {
                    selection.layerIDs.push(list.getReference(i).getIdentifier());
                }
            }
        } catch (e) {}
        
        return selection;
    }

    // 恢复选择状态
    function restoreSelection(selection) {
        if (!selection || selection.layerIDs.length === 0) return;
        
        try {
            // 使用 AM 恢复选择，不展开组
            var desc = new ActionDescriptor();
            var ref = new ActionReference();
            
            // 添加第一个图层
            ref.putIdentifier(charIDToTypeID('Lyr '), selection.layerIDs[0]);
            desc.putReference(charIDToTypeID('null'), ref);
            desc.putBoolean(charIDToTypeID('MkVs'), false); // 不显示/展开
            executeAction(charIDToTypeID('slct'), desc, DialogModes.NO);
            
            // 如果是多选，添加其他图层
            if (selection.layerIDs.length > 1) {
                for (var i = 1; i < selection.layerIDs.length; i++) {
                    var desc2 = new ActionDescriptor();
                    var ref2 = new ActionReference();
                    ref2.putIdentifier(charIDToTypeID('Lyr '), selection.layerIDs[i]);
                    desc2.putReference(charIDToTypeID('null'), ref2);
                    desc2.putEnumerated(stringIDToTypeID('selectionModifier'), stringIDToTypeID('selectionModifierType'), stringIDToTypeID('addToSelection'));
                    desc2.putBoolean(charIDToTypeID('MkVs'), false);
                    executeAction(charIDToTypeID('slct'), desc2, DialogModes.NO);
                }
            }
        } catch (e) {
            // 恢复失败，静默处理
        }
    }

    // 快速获取选中的图层信息（只获取ID和名称）
    function getSelectedLayerInfosFast() {
        var infos = [];
        
        try {
            var ref = new ActionReference();
            ref.putProperty(charIDToTypeID('Prpr'), stringIDToTypeID('targetLayersIDs'));
            ref.putEnumerated(charIDToTypeID('Dcmn'), charIDToTypeID('Ordn'), charIDToTypeID('Trgt'));
            var desc = executeActionGet(ref);
            
            if (desc.hasKey(stringIDToTypeID('targetLayersIDs'))) {
                var list = desc.getList(stringIDToTypeID('targetLayersIDs'));
                
                for (var i = 0; i < list.count; i++) {
                    var layerID = list.getReference(i).getIdentifier();
                    
                    // 只获取名称
                    var ref2 = new ActionReference();
                    ref2.putIdentifier(charIDToTypeID('Lyr '), layerID);
                    var layerDesc = executeActionGet(ref2);
                    
                    infos.push({
                        id: layerID,
                        name: layerDesc.getString(charIDToTypeID('Nm  '))
                    });
                }
                
                return infos;
            }
        } catch (e) {}
        
        // 单选模式
        if (app.activeDocument.activeLayer) {
            try {
                var ref3 = new ActionReference();
                ref3.putEnumerated(charIDToTypeID('Lyr '), charIDToTypeID('Ordn'), charIDToTypeID('Trgt'));
                var desc3 = executeActionGet(ref3);
                
                infos.push({
                    id: desc3.getInteger(stringIDToTypeID('layerID')),
                    name: app.activeDocument.activeLayer.name
                });
            } catch (e) {}
        }
        
        return infos;
    }

    // 通过信息批量添加标签（使用 AM，不影响选择）
    function batchAddTagByInfo(layerInfos, suffix) {
        beginBatchRename();
        try {
            for (var i = 0; i < layerInfos.length; i++) {
                try {
                    var info = layerInfos[i];
                    var currentName = getLayerNameById(info.id) || info.name;
                    var tags = getLayerTags(currentName);
                    
                    // 检查是否已有该标签
                    if (!arrayContains(tags, suffix)) {
                        var newName = currentName + suffix;
                        setLayerNameById(info.id, newName);
                    }
                } catch (e) {}
            }
        } finally {
            endBatchRename();
        }
    }

    // 批量移除最后标签
    function batchRemoveLastTagByInfo(layerInfos) {
        beginBatchRename();
        try {
            for (var i = 0; i < layerInfos.length; i++) {
                try {
                    var info = layerInfos[i];
                    var currentName = getLayerNameById(info.id) || info.name;
                    var tags = getLayerTags(currentName);
                    
                    if (tags.length > 0) {
                        var lastTag = tags[tags.length - 1];
                        var newName = currentName.substring(0, currentName.length - lastTag.length);
                        setLayerNameById(info.id, newName);
                    }
                } catch (e) {}
            }
        } finally {
            endBatchRename();
        }
    }

    // 批量移除所有标签
    function batchRemoveAllTagsByInfo(layerInfos) {
        beginBatchRename();
        try {
            for (var i = 0; i < layerInfos.length; i++) {
                try {
                    var info = layerInfos[i];
                    var currentName = getLayerNameById(info.id) || info.name;
                    var tags = getLayerTags(currentName);
                    
                    if (tags.length > 0) {
                        var totalLength = 0;
                        for (var j = 0; j < tags.length; j++) {
                            totalLength += tags[j].length;
                        }
                        var newName = currentName.substring(0, currentName.length - totalLength);
                        setLayerNameById(info.id, newName);
                    }
                } catch (e) {}
            }
        } finally {
            endBatchRename();
        }
    }

    // 通过图层ID获取名称
    function getLayerNameById(layerId) {
        try {
            if (layerId === undefined || layerId === null) return null;
            var ref = new ActionReference();
            ref.putIdentifier(charIDToTypeID('Lyr '), layerId);
            var layerDesc = executeActionGet(ref);
            return layerDesc.getString(charIDToTypeID('Nm  '));
        } catch (e) {}
        return null;
    }

    // 选择图层（仅用于兼容性回退）
    function selectLayerById(layerId) {
        if (layerId === undefined || layerId === null) return;
        var desc = new ActionDescriptor();
        var ref = new ActionReference();
        ref.putIdentifier(charIDToTypeID('Lyr '), layerId);
        desc.putReference(charIDToTypeID('null'), ref);
        desc.putBoolean(charIDToTypeID('MkVs'), false);
        executeAction(charIDToTypeID('slct'), desc, DialogModes.NO);
    }

    // 尝试使用 AM 直接改名（无需选中，速度更快）
    function trySetLayerNameByIdAM(layerId, newName) {
        var oldDialogs = null;
        try { oldDialogs = app.displayDialogs; app.displayDialogs = DialogModes.NO; } catch (e) {}
        try {
            var desc = new ActionDescriptor();
            var ref = new ActionReference();
            ref.putIdentifier(charIDToTypeID('Lyr '), layerId);
            desc.putReference(charIDToTypeID('null'), ref);
            
            var nameDesc = new ActionDescriptor();
            nameDesc.putString(charIDToTypeID('Nm  '), newName);
            desc.putObject(charIDToTypeID('T   '), charIDToTypeID('Lyr '), nameDesc);
            
            executeAction(charIDToTypeID('setd'), desc, DialogModes.NO);
            return true;
        } catch (e) {
            return false;
        } finally {
            try { if (oldDialogs !== null && oldDialogs !== undefined) app.displayDialogs = oldDialogs; } catch (e2) {}
        }
    }

    // 通过图层ID设置图层名（AM 优先，失败再走 DOM 解锁）
    function setLayerNameById(layerId, newName) {
        if (layerId === undefined || layerId === null) return;
        if (trySetLayerNameByIdAM(layerId, newName)) return;
        
        var hasBatch = !!__batchContext;
        var selection = hasBatch ? null : saveSelection();
        try {
            selectLayerById(layerId);
            var layer = app.activeDocument.activeLayer;
            if (!layer) return;
            try {
                if (layer.name === newName) return;
            } catch (e) {}

            // 快速尝试直接改名（未锁定时最快）
            try { layer.name = newName; } catch (e) {}
            try {
                if (layer.name === newName) return;
            } catch (e) {}

            // 记录并解锁父组（被锁父组会导致改名不可用）
            var parentLocks = [];
            try {
                var parent = layer.parent;
                while (parent && parent.typename !== "Document") {
                    if (parent.typename === "LayerSet") {
                        var parentLocked = null;
                        try { parentLocked = parent.allLocked; } catch (e) { parentLocked = null; }
                        parentLocks.push({ layer: parent, allLocked: parentLocked });
                        try { if (parentLocked) parent.allLocked = false; } catch (e) {}
                    }
                    parent = parent.parent;
                }
            } catch (e) {}

            // 记录并解锁当前层
            var layerLocks = {};
            try { layerLocks.allLocked = layer.allLocked; if (layer.allLocked) layer.allLocked = false; } catch (e) {}
            try { layerLocks.positionLocked = layer.positionLocked; if (layer.positionLocked) layer.positionLocked = false; } catch (e) {}
            try { layerLocks.transparentPixelsLocked = layer.transparentPixelsLocked; if (layer.transparentPixelsLocked) layer.transparentPixelsLocked = false; } catch (e) {}
            try { layerLocks.pixelsLocked = layer.pixelsLocked; if (layer.pixelsLocked) layer.pixelsLocked = false; } catch (e) {}
            
            // 背景层需要先转为普通图层才能改名
            var wasBackground = false;
            try {
                wasBackground = layer.isBackgroundLayer;
                if (wasBackground) layer.isBackgroundLayer = false;
            } catch (e) {}
            
            try { layer.name = newName; } catch (e) {}
            
            // 恢复当前层锁定
            try { if (layerLocks.allLocked !== undefined) layer.allLocked = layerLocks.allLocked; } catch (e) {}
            try { if (layerLocks.positionLocked !== undefined) layer.positionLocked = layerLocks.positionLocked; } catch (e) {}
            try { if (layerLocks.transparentPixelsLocked !== undefined) layer.transparentPixelsLocked = layerLocks.transparentPixelsLocked; } catch (e) {}
            try { if (layerLocks.pixelsLocked !== undefined) layer.pixelsLocked = layerLocks.pixelsLocked; } catch (e) {}
            
            // 尝试恢复背景层（可能失败，失败则保持普通层）
            if (wasBackground) {
                try { layer.isBackgroundLayer = true; } catch (e) {}
            }
            
            // 恢复父组锁定（逆序）
            for (var i = parentLocks.length - 1; i >= 0; i--) {
                try {
                    if (parentLocks[i].allLocked !== null && parentLocks[i].allLocked !== undefined) {
                        parentLocks[i].layer.allLocked = parentLocks[i].allLocked;
                    }
                } catch (e) {}
            }
        } catch (e) {} finally {
            if (!hasBatch && selection) restoreSelection(selection);
        }
    }

    // 获取图层的所有标签
    function getLayerTags(layerName) {
        var tags = [];
        var name = layerName;
        
        var found = true;
        while (found) {
            found = false;
            for (var k in CONFIG) {
                if (CONFIG.hasOwnProperty(k)) {
                    var suffix = CONFIG[k];
                    if (name.length >= suffix.length && 
                        name.substring(name.length - suffix.length) === suffix) {
                        tags.unshift(suffix);
                        name = name.substring(0, name.length - suffix.length);
                        found = true;
                        break;
                    }
                }
            }
        }
        return tags;
    }

    // 数组包含检查
    function arrayContains(arr, item) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] === item) return true;
        }
        return false;
    }

    // 显示窗口
    w.center();
    w.show();
})();
