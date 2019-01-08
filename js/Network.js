// 默认连接点颜色
twaver.Defaults.TERMINAL_COLOR = '#000000';
// 连线颜色
twaver.Defaults.LINK_COLOR = '#0000FF';
// 默认线颜色
twaver.Defaults.DEFAULT_COLOR = '#800000';
// 默认填充显色
twaver.Defaults.DEFAULT_FILL_COLOR = '#FFFFA4';
// 默认框线颜色
twaver.Defaults.LINE_WIDTH1 = 1;
// 默认连线颜色
twaver.Defaults.LINE_WIDTH2 = 2;
// 名称1字体
twaver.Defaults.NAME1_FONT = '15px arial';
// 名称2字体
twaver.Defaults.NAME2_FONT = '13px arial';
// 名称颜色
twaver.Defaults.NAME_COLOR = '#000091';

twaver.Util.registerImageWithFocusBg = function (name, obj) {
    //设置圆点为左上角
    obj.origin = {
        x: 0,
        y: 0
    };

    twaver.Util.registerImage('twaver.image.' + name, obj);
};

// 输入
twaver.Util.registerImageWithFocusBg('input', {
    lineWidth: twaver.Defaults.LINE_WIDTH1,
    lineColor: twaver.Defaults.DEFAULT_COLOR,
    v: [{
        shape: 'rect',
        x: 0,
        y: 0,
        w: '<%= getWidth() - 20 %>',
        h: '100%'
    }, {
        shape: 'line',
        x1: '<%= getWidth() - 20 %>',
        y1: '<%= getHeight()/2 %>',
        x2: '<%= getWidth() %>',
        y2: '<%= getHeight()/2 %>',
        lineColor: twaver.Defaults.TERMINAL_COLOR,
        lineWidth: twaver.Defaults.LINE_WIDTH2
    }, {
        shape: 'text',
        text: function (data) {
            return data.getClient('sign')
        },
        font: twaver.Defaults.NAME1_FONT,
        fill: twaver.Defaults.NAME_COLOR,
        textAlign: 'left',
        x: 2,
        y: '50%'
    }]
});

// 临时输入
twaver.Util.registerImageWithFocusBg('tempInput', {
    lineWidth: twaver.Defaults.LINE_WIDTH1,
    lineColor: twaver.Defaults.DEFAULT_COLOR,
    fill: twaver.Defaults.DEFAULT_FILL_COLOR,
    v: [{
        shape: 'rect',
        x: 0,
        y: 0,
        w: '<%= getWidth() - 20 %>',
        h: '100%'
    }, {
        shape: 'line',
        x1: 0,
        y1: 0,
        x2: '<%= getWidth() - 20 %>',
        y2: '<%= getHeight() %>'
    }, {
        shape: 'line',
        x1: '<%= getWidth() - 20 %>',
        y1: '<%= getHeight()/2 %>',
        x2: '<%= getWidth() %>',
        y2: '<%= getHeight()/2 %>',
        lineColor: twaver.Defaults.TERMINAL_COLOR,
        lineWidth: twaver.Defaults.LINE_WIDTH2
    }, {
        shape: 'text',
        text: function (data) {
            return data.getClient('sign')
        },
        font: twaver.Defaults.NAME1_FONT,
        fill: twaver.Defaults.NAME_COLOR,
        textAlign: 'left',
        x: 2,
        y: '50%'
    }]
})

// 输出
twaver.Util.registerImageWithFocusBg('output', {
    lineWidth: twaver.Defaults.LINE_WIDTH1,
    lineColor: twaver.Defaults.DEFAULT_COLOR,
    v: [{
        shape: 'rect',
        x: 20,
        y: 0,
        w: '<%= getWidth() - 20 %>',
        h: '100%'
    }, {
        shape: 'line',
        x1: 0,
        y1: '<%= getHeight()/2 %>',
        x2: 20,
        y2: '<%= getHeight()/2 %>',
        lineColor: twaver.Defaults.TERMINAL_COLOR,
        lineWidth: twaver.Defaults.LINE_WIDTH2
    }, {
        shape: 'text',
        text: function (data) {
            return data.getClient('sign')
        },
        font: twaver.Defaults.NAME1_FONT,
        fill: twaver.Defaults.NAME_COLOR,
        textAlign: 'left',
        x: 22,
        y: '50%'
    }]
});

// 临时输出
twaver.Util.registerImageWithFocusBg('tempOutput', {
    lineWidth: twaver.Defaults.LINE_WIDTH1,
    lineColor: twaver.Defaults.DEFAULT_COLOR,
    v: [{
        shape: 'rect',
        x: 20,
        y: 0,
        w: '<%= getWidth() - 20 %>',
        h: '100%'
    }, {
        shape: 'line',
        x1: 20,
        y1: 0,
        x2: '<%= getWidth() %>',
        y2: '<%= getHeight() %>'
    }, {
        shape: 'line',
        x1: 0,
        y1: '<%= getHeight()/2 %>',
        x2: 20,
        y2: '<%= getHeight()/2 %>',
        lineColor: twaver.Defaults.TERMINAL_COLOR,
        lineWidth: twaver.Defaults.LINE_WIDTH2
    }, {
        shape: 'text',
        text: function (data) {
            return data.getClient('sign')
        },
        font: twaver.Defaults.NAME1_FONT,
        fill: twaver.Defaults.NAME_COLOR,
        textAlign: 'left',
        x: 22,
        y: '50%'
    }]
});

twaver.Util.registerShape('twaver.shape.inputs', function (g, shapeData, data, view) {
    // 输入数量
    var inputNum = data.getClient('inputNum') || 0;
    // 非门数量
    var notGateNum = data.getClient('notGateNum') || 0;
    var rect = shapeData.rect;
    var width = rect.w;
    var height = data.getHeight();


    for (var i = 1; i <= inputNum; i++) {
        g.beginPath();

        var resultY = 20 * i;
        if (inputNum % 2 == 0 && i > inputNum / 2) {
            resultY = 20 * (i + 1);
        }
        g.moveTo(0, resultY);
        if (i <= notGateNum) {
            g.lineWidth = twaver.Defaults.LINE_WIDTH2;
            g.lineTo(12, resultY);
            g.stroke();

            g.beginPath();
            g.moveTo(20, resultY);
            g.lineWidth = 1;
            g.arc(16, resultY, 4, 0, 2 * Math.PI, true);
            g.stroke();
        } else {
            g.lineWidth = twaver.Defaults.LINE_WIDTH2;
            g.lineTo(20, resultY);
            g.stroke();
        }
    }
});

// 与
twaver.Util.registerImageWithFocusBg('and', {
    lineWidth: twaver.Defaults.LINE_WIDTH1,
    lineColor: twaver.Defaults.DEFAULT_COLOR,
    v: [{
        shape: 'twaver.shape.inputs',
        rect: {
            x: 0,
            y: 0,
            w: '25%',
            h: '100%'
        },
        lineColor: twaver.Defaults.TERMINAL_COLOR,
        lineWidth: twaver.Defaults.LINE_WIDTH2
    }, {
        shape: 'rect',
        x: '25%',
        y: 0,
        w: '50%',
        h: '100%'
    }, {
        shape: 'text',
        text: '&',
        fill: twaver.Defaults.NAME_COLOR,
        font: twaver.Defaults.NAME1_FONT,
        x: '50%',
        y: '50%'
    }, {
        shape: 'line',
        x1: '<%= getWidth() - 20 %>',
        y1: '<%= getHeight()/2 %>',
        x2: '<%= getWidth() %>',
        y2: '<%= getHeight()/2 %>',
        lineColor: twaver.Defaults.TERMINAL_COLOR,
        lineWidth: twaver.Defaults.LINE_WIDTH2
    }]
})

// 或
twaver.Util.registerImageWithFocusBg('or', {
    lineWidth: twaver.Defaults.LINE_WIDTH1,
    lineColor: twaver.Defaults.DEFAULT_COLOR,
    v: [{
        shape: 'twaver.shape.inputs',
        rect: {
            x: 0,
            y: 0,
            w: '25%',
            h: '100%'
        },
        lineColor: twaver.Defaults.TERMINAL_COLOR,
        lineWidth: twaver.Defaults.LINE_WIDTH2
    }, {
        shape: 'rect',
        x: '25%',
        y: 0,
        w: '50%',
        h: '100%'
    }, {
        shape: 'text',
        text: '≥',
        fill: twaver.Defaults.NAME_COLOR,
        font: twaver.Defaults.NAME1_FONT,
        x: '50%',
        y: '50%'
    }, {
        shape: 'line',
        x1: '<%= getWidth() - 20 %>',
        y1: '<%= getHeight()/2 %>',
        x2: '<%= getWidth() %>',
        y2: '<%= getHeight()/2 %>',
        lineColor: twaver.Defaults.TERMINAL_COLOR,
        lineWidth: twaver.Defaults.LINE_WIDTH2
    }]
})

// 非
twaver.Util.registerImageWithFocusBg('not', {
    lineWidth: twaver.Defaults.LINE_WIDTH1,
    lineColor: twaver.Defaults.DEFAULT_COLOR,
    width: 60,
    height: 40,
    v: [{
        shape: 'line',
        x1: 0,
        y1: 20,
        x2: 20,
        y2: 20,
        lineColor: twaver.Defaults.TERMINAL_COLOR,
        lineWidth: twaver.Defaults.LINE_WIDTH2
    }, {
        shape: 'rect',
        x: 20,
        y: 4,
        w: 12,
        h: 36
    }, {
        shape: 'circle',
        cx: 36,
        cy: 20,
        r: 4
    }, {
        shape: 'line',
        x1: 40,
        y1: 20,
        x2: 60,
        y2: 20,
        lineColor: twaver.Defaults.TERMINAL_COLOR,
        lineWidth: twaver.Defaults.LINE_WIDTH2
    }]
})

// 压板
twaver.Util.registerImageWithFocusBg('yb', {
    w: 80,
    h: 40,
    lineWidth: twaver.Defaults.LINE_WIDTH1,
    lineColor: twaver.Defaults.DEFAULT_COLOR,
    v: [{
        shape: 'line',
        x1: 0,
        y1: 20,
        x2: 20,
        y2: 20,
        lineColor: twaver.Defaults.TERMINAL_COLOR,
        lineWidth: twaver.Defaults.LINE_WIDTH2
    }, {
        shape: 'circle',
        cx: 25,
        cy: 20,
        r: 5
    }, {
        shape: 'line',
        x1: 25,
        y1: 15,
        x2: 55,
        y2: 15
    }, {
        shape: 'line',
        x1: 25,
        y1: 25,
        x2: 55,
        y2: 25
    }, {
        shape: 'circle',
        cx: 55,
        cy: 20,
        r: 5
    }, {
        shape: 'line',
        x1: 60,
        y1: 20,
        x2: 80,
        y2: 20,
        lineColor: twaver.Defaults.TERMINAL_COLOR,
        lineWidth: twaver.Defaults.LINE_WIDTH2
    }]
})

// 定时器
twaver.Util.registerImageWithFocusBg('time', {
    lineWidth: twaver.Defaults.LINE_WIDTH1,
    lineColor: twaver.Defaults.DEFAULT_COLOR,
    v: [{
        shape: 'line',
        x1: 0,
        y1: 20,
        x2: 20,
        y2: 20,
        lineColor: twaver.Defaults.TERMINAL_COLOR,
        lineWidth: twaver.Defaults.LINE_WIDTH2
    }, {
        shape: 'rect',
        x: 20,
        y: 0,
        w: '<%= getWidth() - 40 %>',
        h: '100%',
    }, {
        shape: 'line',
        x1: '<%= getWidth() - 20 %>',
        y1: 0,
        x2: 20,
        y2: '<%= getHeight() %>'
    }, {
        shape: 'text',
        text: function (data) {
            var sign = data.getClient('sign').split('/');
            return sign[0];
        },
        x: '<%= getWidth()/4 + 10 %>',
        y: '<%= getHeight()/2 %>',
        textAlign: 'center',
        textBaseline: 'bottom',
        fill: twaver.Defaults.NAME_COLOR,
        font: '13px arial'
    }, {
        shape: 'text',
        text: function (data) {
            var sign = data.getClient('sign').split('/');
            return sign[1];
        },
        x: '<%= getWidth()*3/4 - 10 %>',
        y: '<%= getHeight()/2+4 %>',
        textAlign: 'center',
        textBaseline: 'top',
        fill: twaver.Defaults.NAME_COLOR,
        font: '13px arial'
    }, {
        shape: 'line',
        x1: '<%= getWidth() - 20 %>',
        y1: '<%= getHeight()/2 %>',
        x2: '<%= getWidth() %>',
        y2: '<%= getHeight()/2 %>',
        lineColor: twaver.Defaults.TERMINAL_COLOR,
        lineWidth: twaver.Defaults.LINE_WIDTH2
    }]
})

// kg
twaver.Util.registerImageWithFocusBg('kg', {
    w: 80,
    h: 60,
    lineWidth: twaver.Defaults.LINE_WIDTH1,
    lineColor: twaver.Defaults.DEFAULT_COLOR,
    v: [{
        shape: 'line',
        x1: 0,
        y1: 20,
        x2: 20,
        y2: 20,
        lineColor: twaver.Defaults.TERMINAL_COLOR,
        lineWidth: twaver.Defaults.LINE_WIDTH2
    }, {
        shape: 'circle',
        cx: 23,
        cy: 20,
        r: 3
    }, {
        shape: 'circle',
        cx: 57,
        cy: 20,
        r: 3
    }, {
        shape: 'text',
        text: '1',
        fill: twaver.Defaults.DEFAULT_COLOR,
        x: 32,
        y: 20
    }, {
        shape: 'line',
        x1: 54,
        y1: 20,
        x2: 32,
        y2: 40,
    }, {
        shape: 'text',
        text: 'C0',
        fill: twaver.Defaults.DEFAULT_COLOR,
        x: 40,
        y: 40
    }, {
        shape: 'text',
        text: "'1'",
        fill: twaver.Defaults.DEFAULT_COLOR,
        x: 28,
        y: 50
    }, {
        shape: 'line',
        x1: 60,
        y1: 20,
        x2: 80,
        y2: 20,
        lineColor: twaver.Defaults.TERMINAL_COLOR,
        lineWidth: twaver.Defaults.LINE_WIDTH2
    }]
})

// 连接点
twaver.Util.registerImageWithFocusBg('point', {
    w: 6,
    h: 6,
    v: [{
        shape: 'circle',
        cx: 3,
        cy: 3,
        r: 3,
        fill: twaver.Defaults.DEFAULT_COLOR
    }]
})

// 接地
twaver.Util.registerImageWithFocusBg('ground', {
    w: 60,
    h: 40,
    lineWidth: twaver.Defaults.LINE_WIDTH1,
    lineColor: twaver.Defaults.DEFAULT_COLOR,
    v: [{
        shape: 'line',
        x1: 15,
        y1: 16,
        x2: 15,
        y2: 24,
    }, {
        shape: 'line',
        x1: 20,
        y1: 14,
        x2: 20,
        y2: 26,
    }, {
        shape: 'line',
        x1: 25,
        y1: 12,
        x2: 25,
        y2: 28,
    }, {
        shape: 'line',
        x1: 30,
        y1: 10,
        x2: 30,
        y2: 30,
    }, {
        shape: 'line',
        x1: 30,
        y1: 20,
        x2: 40,
        y2: 20
    }, {
        shape: 'line',
        x1: 40,
        y1: 20,
        x2: 60,
        y2: 20,
        lineColor: twaver.Defaults.TERMINAL_COLOR,
        lineWidth: twaver.Defaults.LINE_WIDTH2
    }]
})

// Vcc
twaver.Util.registerImageWithFocusBg('vcc', {
    w: 60,
    h: 40,
    lineWidth: twaver.Defaults.LINE_WIDTH1,
    lineColor: twaver.Defaults.DEFAULT_COLOR,
    v: [{
        shape: 'text',
        text: 'v\nc\nc\n',
        x: 20,
        y: 25,
        fill: twaver.Defaults.DEFAULT_COLOR,
        font: '10px arial'
    }, {
        shape: 'line',
        x1: 25,
        y1: 8,
        x2: 25,
        y2: 32,
        fill: twaver.Defaults.DEFAULT_COLOR
    }, {
        shape: 'line',
        x1: 25,
        y1: 20,
        x2: 40,
        y2: 20,
        fill: twaver.Defaults.DEFAULT_COLOR
    }, {
        shape: 'line',
        x1: 40,
        y1: 20,
        x2: 60,
        y2: 20,
        lineColor: twaver.Defaults.TERMINAL_COLOR,
        lineWidth: twaver.Defaults.LINE_WIDTH2
    }]
})

// open
twaver.Util.registerImageWithFocusBg('open', {
    w: 80,
    h: 40,
    lineWidth: twaver.Defaults.LINE_WIDTH1,
    lineColor: twaver.Defaults.DEFAULT_COLOR,
    v: [{
        shape: 'line',
        x1: 0,
        y1: 20,
        x2: 20,
        y2: 20,
        lineColor: twaver.Defaults.TERMINAL_COLOR,
        lineWidth: twaver.Defaults.LINE_WIDTH2
    }, {
        shape: 'circle',
        cx: 24,
        cy: 20,
        r: 4,
        lineColor: twaver.Defaults.DEFAULT_COLOR
    }, {
        shape: 'circle',
        cx: 56,
        cy: 20,
        r: 4,
        lineColor: twaver.Defaults.DEFAULT_COLOR
    }, {
        shape: 'line',
        x1: 60,
        y1: 20,
        x2: 80,
        y2: 20,
        lineColor: twaver.Defaults.TERMINAL_COLOR,
        lineWidth: twaver.Defaults.LINE_WIDTH2
    }, {
        shape: 'line',
        x1: 24,
        y1: 16,
        x2: 44,
        y2: 5,
        lineColor: twaver.Defaults.DEFAULT_COLOR
    }, {
        shape: 'path',
        data: [48, 16, 48, 20, 52, 20],
        lineColor: twaver.Defaults.DEFAULT_COLOR
    }]
})

// Close
twaver.Util.registerImageWithFocusBg('close', {
    w: 80,
    h: 40,
    lineWidth: twaver.Defaults.LINE_WIDTH1,
    lineColor: twaver.Defaults.DEFAULT_COLOR,
    v: [{
        shape: 'line',
        x1: 0,
        y1: 20,
        x2: 20,
        y2: 20,
        lineColor: twaver.Defaults.TERMINAL_COLOR,
        lineWidth: twaver.Defaults.LINE_WIDTH2
    }, {
        shape: 'circle',
        cx: 24,
        cy: 20,
        r: 4,
        lineColor: twaver.Defaults.DEFAULT_COLOR
    }, {
        shape: 'circle',
        cx: 56,
        cy: 20,
        r: 4,
        lineColor: twaver.Defaults.DEFAULT_COLOR
    }, {
        shape: 'line',
        x1: 60,
        y1: 20,
        x2: 80,
        y2: 20,
        lineColor: twaver.Defaults.TERMINAL_COLOR,
        lineWidth: twaver.Defaults.LINE_WIDTH2
    }, {
        shape: 'line',
        x1: 24,
        y1: 24,
        x2: 48,
        y2: 30,
        lineColor: twaver.Defaults.DEFAULT_COLOR
    }, {
        shape: 'path',
        data: [48, 24, 48, 20, 52, 20],
        lineColor: twaver.Defaults.DEFAULT_COLOR
    }]
})

twaver.Node.prototype.getToolTip = function() {
    var idStr = this.getClient('id');
    var inputs = this.getClient('inputs') || [];
    return "id:" + idStr + "<br/> inputs:" + inputs.join(',');
}

// 输入
twaver.Input = function (id) {
    twaver.Input.superClass.constructor.call(this, id);
    this.setImage('twaver.image.input');
    this.s('label.position', 'left.right');
    this.s('label.color', twaver.Defaults.NAME_COLOR);
    this.s('label.font', '15px arial');
    this.s('label2.position', 'topleft.topright');
    this.s('label2.color', '#3A0080');
    this.s('label2.font', '13px arial');
}

twaver.Util.ext('twaver.Input', twaver.Node, {})

// 临时输入
twaver.TempInput = function (id) {
    twaver.TempInput.superClass.constructor.call(this, id);
    this.setImage('twaver.image.tempInput');

    this.s('label.position', 'left.right');
    this.s('label.color', twaver.Defaults.NAME_COLOR);
    this.s('label.font', '15px arial');
    this.s('label2.position', 'topleft.topright');
    this.s('label2.color', twaver.Defaults.NAME_COLOR);
    this.s('label2.font', '13px arial');
}

twaver.Util.ext('twaver.TempInput', twaver.Node, {})

// 输出
twaver.Output = function (id) {
    twaver.Output.superClass.constructor.call(this, id);
    this.setImage('twaver.image.output');

    this.s('label.position', 'left.right');
    this.s('label.xoffset', 20);
    this.s('label.color', twaver.Defaults.NAME_COLOR);
    this.s('label.font', '15px arial');
    this.s('label2.position', 'topleft.topright');
    this.s('label2.xoffset', 20);
    this.s('label2.color', twaver.Defaults.NAME_COLOR);
    this.s('label2.font', '13px arial');
}

twaver.Util.ext('twaver.Output', twaver.Node, {})

// 临时输出
twaver.TempOutput = function (id) {
    twaver.TempOutput.superClass.constructor.call(this, id);
    this.setImage('twaver.image.tempOutput');
    this.s('label.xoffset', 20);
    this.s('label.position', 'left.right');
    this.s('label.color', twaver.Defaults.NAME_COLOR);
    this.s('label.font', '15px arial');
    this.s('label2.position', 'topleft.topright');
    this.s('label2.xoffset', 20);
    this.s('label2.color', twaver.Defaults.NAME_COLOR);
    this.s('label2.font', '13px arial');
}

twaver.Util.ext('twaver.TempOutput', twaver.Node, {})

// 与
twaver.And = function (id) {
    twaver.And.superClass.constructor.call(this, id);
    this.setImage('twaver.image.and');
    this.s('label.position', 'center');
    this.s('label.color', twaver.Defaults.NAME_COLOR);
    this.s('label.font', '15px arial');
    this.s('label2.position', 'top.top');
    this.s('label2.color', twaver.Defaults.NAME_COLOR);
    this.s('label2.font', '13px arial');
}

twaver.Util.ext('twaver.And', twaver.Node, {})

// 或
twaver.Or = function (id) {
    twaver.Or.superClass.constructor.call(this, id);
    this.setImage('twaver.image.or');
    this.s('label.position', 'center');
    this.s('label.color', twaver.Defaults.NAME_COLOR);
    this.s('label.font', '15px arial');
    this.s('label2.position', 'top.top');
    this.s('label2.color', twaver.Defaults.NAME_COLOR);
    this.s('label2.font', '13px arial');
}

twaver.Util.ext('twaver.Or', twaver.Node, {})

// 非
twaver.Not = function (id) {
    twaver.Not.superClass.constructor.call(this, id);
    this.setImage('twaver.image.not');
}

twaver.Util.ext('twaver.Not', twaver.Node, {})

// 压板
twaver.YB = function (id) {
    twaver.YB.superClass.constructor.call(this, id);
    this.setImage('twaver.image.yb');
    this.s('label.position', 'top.top');
    this.s('label.color', twaver.Defaults.NAME_COLOR);
    this.s('label.font', '15px arial');
    this.s('label2.position', 'top.top');
    this.s('label2.color', twaver.Defaults.NAME_COLOR);
    this.s('label2.font', '15px arial');
    this.s('label2.yoffset', -17);
}

twaver.Util.ext('twaver.YB', twaver.Node, {})

// 定时器
twaver.Time = function (id) {
    twaver.Time.superClass.constructor.call(this, id);
    this.setImage('twaver.image.time');
    this.s('label2.color', twaver.Defaults.NAME_COLOR);
    this.s('label2.font', '15px arial');
}

twaver.Util.ext('twaver.Time', twaver.Node, {})

// KG
twaver.KG = function (id) {
    twaver.KG.superClass.constructor.call(this, id);
    this.setImage('twaver.image.kg');
    this.s('label.position', 'top.top');
    this.s('label.color', twaver.Defaults.NAME_COLOR);
    this.s('label.font', '15px arial');
    this.s('label2.position', 'top.top');
    this.s('label2.color', twaver.Defaults.NAME_COLOR);
    this.s('label2.font', '15px arial');
    this.s('label2.yoffset', -17);
}

twaver.Util.ext('twaver.KG', twaver.Node, {})

// 折线
twaver.LinkLine = function () {
    twaver.LinkLine.superClass.constructor.apply(this, arguments);
    this.s('link.color', twaver.Defaults.LINK_COLOR);
    this.s('link.width', 2);

    this.addPropertyChangeListener(function (e) {
        var element = e.source;
        if (e.property === 'C:state') {
            var state = element.getClient('state');
            element.setStyle('link.color', state ? 'green' : 'red');
        }
    });
}

twaver.Util.ext('twaver.LinkLine', twaver.ShapeLink, {
    getToolTip: function () {
        return "id: " + this.getId() + "<br/>inputs: " + this.getClient('lineInput')
    }
})

// 连接点
twaver.LinkPoint = function (id) {
    twaver.LinkPoint.superClass.constructor.call(this, id);
    this.setImage('twaver.image.point');
}

twaver.Util.ext('twaver.LinkPoint', twaver.Node, {})

// 隐藏的连接点
twaver.HiddenPort = function (id) {
    twaver.HiddenPort.superClass.constructor.call(this, id);
    this.setSize(0, 0);
}

twaver.Util.ext('twaver.HiddenPort', twaver.Node, {})

// 文本
twaver.Text = function () {
    twaver.Text.superClass.constructor.apply(this, arguments);
    this.s('label.color', twaver.Defaults.NAME_COLOR);
    this.s('label.font', twaver.Defaults.NAME2_FONT);
    this.setImage('');
}

twaver.Util.ext('twaver.Text', twaver.Node, {})

// 接地
twaver.GND = function () {
    twaver.GND.superClass.constructor.apply(this, arguments);
    this.setImage('twaver.image.ground');
}

twaver.Util.ext('twaver.GND', twaver.Node, {})

// Vcc
twaver.Vcc = function () {
    twaver.Vcc.superClass.constructor.apply(this, arguments);
    this.setImage('twaver.image.vcc');
    this.s('label2.color', twaver.Defaults.NAME_COLOR);
    this.s('label2.font', twaver.Defaults.NAME_FONT);
}

twaver.Util.ext('twaver.Vcc', twaver.Node, {})

// Open
twaver.Open = function () {
    twaver.Open.superClass.constructor.apply(this, arguments);
    this.setImage('twaver.image.open');
}

twaver.Util.ext('twaver.Open', twaver.Node, {})

// Close
twaver.Close = function () {
    twaver.Close.superClass.constructor.apply(this, arguments);
    this.setImage('twaver.image.close');
}

twaver.Util.ext('twaver.Close', twaver.Node, {})

twaver.vector.SpniceNetwork = function (id) {
    twaver.vector.SpniceNetwork.superClass.constructor.call(this, id);
    this.currentTime = 0;
    // id搜索元素
    this.idFinder = new twaver.QuickFinder(this.getElementBox(), 'id', 'client');
    // input查询线
    this.linkFinder = new twaver.QuickFinder(this.getElementBox(), 'lineInput', 'client');

    // 图元不可以拖动
    this.setMovableFunction(function () {
        return false;
    });
    this.setEditableFunction(function () {
        return false;
    });
}

twaver.Util.ext('twaver.vector.SpniceNetwork', twaver.vector.Network, {
    intersect: function () {
        var result = new Array();
        var obj = {};
        for (var i = 0; i < arguments.length; i++) {
            for (var j = 0; j < arguments[i].length; j++) {
                var str = arguments[i][j];
                if (!obj[str]) {
                    obj[str] = 1;
                }
                else {
                    obj[str]++;
                    if (obj[str] == arguments.length)
                    {
                        result.push(str);
                    }
                }//end else
            }//end for j
        }//end for i
        return result;
    },

    findOperatorElement: function(inputs) {
        if (!inputs) {
            return [];
        }

        var _this = this;
        var datas = this.getElementBox().getDatas().toArray() || [];
        var result = [];
        datas.forEach(function (dataItem) {
            var dataInputs = dataItem.getClient('inputs') || [];
            var isOperator = dataItem instanceof twaver.Or || dataItem instanceof twaver.Not || dataItem instanceof twaver.And || dataItem instanceof twaver.Time;
            var setStateStatus = dataItem.getClient('setStateStatus');
            if (isOperator && _this.intersect(dataInputs, inputs).length > 0 && !setStateStatus) {
                result.push(dataItem);
            }
        })
        return result;
    },

    resetSetState: function() {
        this.getElementBox().forEach(function (element) {
            element.setClient('setStateStatus', false);
        })
    },

    setState: function(element, state) {
        var setStateStatus = element.getClient('setStateStatus');
        if (!setStateStatus) {
            element.setClient('state', state);
            element.setClient('setStateStatus', true);
        }
    },

    setStates: function(inputs, states) {
        var _this = this;

        // 设置直接关联的input和linkLine
        inputs.forEach(function (inputId, index) {
            var inputElement = _this.idFinder.findFirst(inputId);
            var linkLine = _this.linkFinder.find(inputId).toArray() || [];
            _this.setState(inputElement, states[index]);

            var lineIds = [];
            linkLine.forEach(function (linkLineItem) {
                lineIds.push(linkLineItem.getId());
                _this.setState(linkLineItem, states[index]);
            })
        });

        // 设置对应下一级操作符的
        var elements = this.findOperatorElement(inputs);

        if (elements && elements.length > 0) {
            var operatorElements = [];

            elements.forEach(function (element) {
                if (element instanceof twaver.Or) {
                    var elementInputs = element.getClient('inputs');
                    var notGateNum = element.getClient('notGateNum') || 0;
                    var hasAllResult = elementInputs.filter(function (item) {
                        var inputState = _this.idFinder.findFirst(item).getClient('state');
                        return typeof inputState === 'boolean';
                    }).length === elementInputs.length;
                    var hasTrueResult = elementInputs.filter(function (item, index) {
                        var inputState = _this.idFinder.findFirst(item).getClient('state');
                        if (typeof inputState === 'boolean') {
                            if (index < notGateNum) {
                                inputState = !inputState;
                            }
                            return inputState;
                        } else {
                            return false;
                        }
                    }).length !== 0;

                    var result = false;
                    elementInputs.forEach(function (inputId, index) {
                        var inputState = _this.idFinder.findFirst(inputId).getClient('state');
                        if (typeof inputState === 'boolean') {
                            if (index < notGateNum) {
                                result = result || !inputState;
                            } else {
                                result = result || inputState;
                            }
                        }
                    })
                    if (hasAllResult || hasTrueResult) {
                        _this.setState(element, result);
                        operatorElements.push(element);
                    }
                } else if (element instanceof twaver.And) {
                    var elementInputs = element.getClient('inputs');
                    var notGateNum = element.getClient('notGateNum') || 0;
                    var hasAllResult = elementInputs.filter(function (item) {
                        var inputState = _this.idFinder.findFirst(item).getClient('state');
                        return typeof inputState === 'boolean';
                    }).length === elementInputs.length;
                    var hasFalseResult = elementInputs.filter(function (item, index) {
                        var inputState = _this.idFinder.findFirst(item).getClient('state');
                        if (typeof inputState === 'boolean') {
                            if (index < notGateNum) {
                                inputState = !inputState;
                            }
                            return !inputState;
                        } else {
                            return false;
                        }
                    }).length !== 0;

                    var result = true;
                    elementInputs.forEach(function (inputId, index) {
                        var inputState = _this.idFinder.findFirst(inputId).getClient('state');
                        if (typeof inputState === 'boolean') {
                            if (index < notGateNum) {
                                result = result && !inputState;
                            } else {
                                result = result && inputState;
                            }
                        }
                    })
                    if (hasAllResult || hasFalseResult) {
                        _this.setState(element, result);
                        operatorElements.push(element);
                    }
                } else if (element instanceof twaver.Not) {
                    var elementInput = element.getClient('inputs');
                    if (elementInput) {
                        elementInput = elementInput[0];
                        var inputState = _this.idFinder.findFirst(elementInput).getClient('state');
                        if (typeof inputState === 'boolean') {
                            _this.setState(element, !inputState);
                            operatorElements.push(element);
                        }
                    }
                } else if (element instanceof twaver.Time) {
                    var elementInput = element.getClient('inputs');
                    if (elementInput) {
                        elementInput = elementInput[0];
                        var inputState = _this.idFinder.findFirst(elementInput).getClient('state');
                        if (typeof inputState === 'boolean') {
                            var sign = element.getClient('sign');
                            sign = sign.split('/');
                            var topLeftTime = parseInt(sign[0]);
                            var rightBottomTime = parseInt(sign[1]);
                            if (topLeftTime !== 0) {
                                setTimeout(function() {
                                    _this.setState(element, inputState);
                                    _this.setStates([element.getClient('id')], [inputState]);
                                }, topLeftTime);
                            }

                            if (rightBottomTime !== 0) {
                                setTimeout(function() {
                                    _this.setState(element, !inputState);
                                    _this.setStates([element.getClient('id')], [!inputState]);
                                }, rightBottomTime);
                            }
                        }
                    }
                } else {
                    // _this.setState(element, );
                }
            })

            if (operatorElements.length > 0) {
                _this.setStates(operatorElements.map(function (item) {
                    return item.getClient('id');
                }), operatorElements.map(function (item) {
                    return item.getClient('state');
                }));
            }
        }
    },

    startZoomOverView: function () {
        var _this = this;
        var zoomOverview = function(evt) {
            if (evt.kind === 'validateEnd') {
                _this.removeViewListener(zoomOverview);
                _this.zoomOverview();
            }
        };
        this.addViewListener(zoomOverview);
    }
});