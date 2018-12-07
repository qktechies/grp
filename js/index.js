$(function () {
    var box = new twaver.ElementBox();
    var network = new twaver.vector.SpniceNetwork(box);
    box.setStyle('background.type', 'vector');
    box.setStyle('background.vector.fill', true);
    box.setStyle('background.vector.fill.color', '#FFFFE1');

    $('#graph').append(network.getView());

    var rect = document.getElementById('graph').getBoundingClientRect();
    network.adjustBounds({
        x: 0,
        y: 0,
        width: rect.width,
        height: rect.height
    });

    window.addEventListener('resize', () => {
        var rect = document.getElementById('graph').getBoundingClientRect();
        network.adjustBounds({
            x: 0,
            y: 0,
            width: rect.width,
            height: rect.height
        });
    }, true);

    $.loadGrpData = function (data) {
        box.clear();
        data = data.sort(function (item1, item2) {
            if (item1.type === 'LinkLine') {
                return 1;
            } else if (item2.type === 'LinkLine') {
                return -1;
            } else {
                return 0;
            }
        })

        data = data.map(function (item) {
            if (typeof item.x === 'number') {
                if (['Input', 'TempInput', 'LinkPoint'].indexOf(item.type1) === -1) {
                    item.x = (item.x - 1) * 20;
                } else {
                    item.x = (item.x) * 20;
                }
            }
            if (typeof item.y === 'number') {
                item.y = item.y * 20;
            }
            if (typeof item.width === 'number') {
                if (['Input', 'TempInput', 'Output', 'TempOutput'].indexOf(item.type1) !== -1) {
                    item.width = item.width + 1;
                } else if (item.type1 !== 'Point') {
                    item.width = item.width + 2;
                }
                item.width = item.width * 20
            }
            if (typeof item.height === 'number') {
                item.height = (item.type1 === 'KG' ? item.height + 1 : item.height) * 20;
            }
            if (typeof item.type1X === 'number') {
                item.type1X = item.type1X * 20
            }
            if (typeof item.type1Y === 'number') {
                item.type1Y = item.type1Y * 20
            }

            if (Array.isArray(item.points)) {
                item.points = item.points.map(function (point) {
                    point.x = point.x * 20;
                    point.y = point.y * 20;

                    return point;
                })
            }

            return item;
        })

        // 展示所有的图元
        for (var i = 0; i < data.length; i++) {
            var info = data[i];
            var type = info.type1;
            var element = new twaver[type](i + 1)
            $.isNumeric(info.x) && $.isNumeric(info.y) && element.setLocation(info.x, info.y);
            info.width && element.setWidth(info.width);
            info.height && element.setHeight(info.height);
            element.setClient('inputNum', info.inputNum);
            element.setClient('notGateNum', info.notGateNum);
            element.setClient('sign', info.sign);
            if (type === 'LinkPoint') {
                $.isNumeric(info.x) && $.isNumeric(info.y) && element.setCenterLocation(info.x, info.y);
            }
            if (['KG', 'YB'].indexOf(type) !== -1) {
                element.setName(info.sign);
            }
            if (info.showName) {
                info.name && element.setName2(info.name);
            }

            if (type === 'LinkLine') {
                var points = info.points;
                var fromPoint = points[0];
                var toPoint = points[points.length - 1];

                var currenteElements = box.getDatas().toArray();
                var fromNode = currenteElements.filter(function (item) {
                    return item instanceof twaver.LinkPoint && item.getCenterLocation().x === fromPoint.x && item.getCenterLocation().y === fromPoint.y;
                })

                var toNode = currenteElements.filter(function (item) {
                    return item instanceof twaver.LinkPoint && item.getCenterLocation().x === toPoint.x && item.getCenterLocation().y === toPoint.y;
                })

                if (fromNode.length === 0) {
                    fromNode = new twaver.HiddenPort();
                    fromNode.setLocation(fromPoint.x, fromPoint.y);
                    box.add(fromNode);
                } else {
                    fromNode = fromNode[0];
                }

                if (toNode.length === 0) {
                    toNode = new twaver.HiddenPort();
                    toNode.setLocation(toPoint.x, toPoint.y);
                    box.add(toNode);
                } else {
                    toNode = toNode[0];
                }

                element.setFromNode(fromNode);
                element.setToNode(toNode);

                for (var j = 1; j < points.length - 1; j++) {
                    element.addPoint(points[j]);
                }
            }

            box.add(element);
        }

        // 获取所有图元的Inputs
        var points = [];
        box.getDatas().forEach(function (item) {
            if (item instanceof twaver.LinkPoint) {
                points.push({
                    location: item.getCenterLocation(),
                    inputs: [],
                    outputs: [],
                    lines: []
                })
            } else if (item instanceof twaver.LinkLine) {
                var fromNode = item.getFromNode();
                points.push({
                    location: fromNode.getLocation(),
                    inputs: [],
                    outputs: [],
                    lines: []
                });

                var linePoints = item.getPoints().toArray();
                linePoints.forEach(function (pointItem) {
                    points.push({
                        location: pointItem,
                        inputs: [],
                        outputs: [],
                        lines: []
                    })
                });

                var toNode = item.getToNode();
                points.push({
                    location: toNode.getLocation(),
                    inputs: [],
                    outputs: [],
                    lines: []
                });

            }
        });

        var isPointInRect = function (point, element) {
            var minX = element.getX();
            var maxX = element.getX() + element.getWidth();
            var minY = element.getY();
            var maxY = element.getY() + element.getHeight();
            return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
        }

        var findPointInputsAndOutputs = function (point) {
            var elements = box.getDatas().toArray();
            var inputs = [];
            var outputs = [];
            for (var i = 0; i < elements.length; i++) {
                var element = elements[i];
                if (element === point ||
                    element instanceof twaver.HiddenPort ||
                    element instanceof twaver.LinkPoint ||
                    element instanceof twaver.LinkLine) {
                    continue;
                }

                if (element instanceof twaver.Node && isPointInRect(point, element)) {
                    if (point.x === element.getX()) {
                        outputs.push(JSON.stringify({
                            id: element.getId(),
                            y: point.y
                        }));
                    } else {
                        inputs.push(element.getId());
                    }
                }
            }

            return {
                inputs: inputs,
                outputs: outputs
            };
        };

        var isPointInLine = function (point, line) {

            var linePoints = line.getPoints().toArray();
            linePoints.unshift(line.getFromNode().getCenterLocation());
            linePoints.push(line.getToNode().getCenterLocation());

            var result = false;

            for (var i = 0; i < linePoints.length - 1; i++) {
                var x1 = linePoints[i].x;
                var y1 = linePoints[i].y;
                var x2 = linePoints[i + 1].x;
                var y2 = linePoints[i + 1].y;
                var isInLine = (y1 - point.y) * (x2 - x1) - (x1 - point.x) * (y2 - y1);
                if (
                    isInLine === 0 &&
                    point.x >= Math.min(x1, x2) &&
                    point.x <= Math.max(x1, x2) &&
                    point.y >= Math.min(y1, y2) &&
                    point.y <= Math.max(y1, y2)
                ) {
                    result = true;
                    break;
                }
            }

            return result;
        }

        var linkLines = box.getDatas().toArray().filter(function (item) {
            return item instanceof twaver.LinkLine;
        });
        points.forEach(function (pointItem) {
            var inputsAndOutputs = findPointInputsAndOutputs(pointItem.location);
            pointItem.inputs = inputsAndOutputs.inputs;
            pointItem.outputs = inputsAndOutputs.outputs;

            linkLines.forEach(function (linkItem) {
                if (isPointInLine(pointItem.location, linkItem)) {
                    pointItem.lines.push(linkItem);
                }
            })


        });

        for (var i = 0; i < points.length - 1; i++) {
            var pointInfo1 = points[i];

            var deleted = false;
            for (var j = i + 1; j < points.length; j++) {
                var pointInfo2 = points[j];

                var lineIntersection = pointInfo1.lines.filter(function (v) {
                    return pointInfo2.lines.indexOf(v) > -1
                });
                if (lineIntersection.length !== 0) {
                    pointInfo2.inputs = pointInfo2.inputs.concat(pointInfo1.inputs.filter(function (v) {
                        return pointInfo2.inputs.indexOf(v) === -1
                    }));
                    pointInfo2.outputs = pointInfo2.outputs.concat(pointInfo1.outputs.filter(function (v) {
                        return pointInfo2.outputs.indexOf(v) === -1
                    }));
                    pointInfo2.lines = pointInfo2.lines.concat(pointInfo1.lines.filter(function (v) {
                        return pointInfo2.lines.indexOf(v) === -1
                    }));
                    deleted = true;
                    pointInfo2.deleted = false;
                    break;
                }
            }
            pointInfo1.deleted = deleted;
        }

        points = points.filter(function(item) {
            return !item.deleted;
        });

        points.forEach(function(relation) {
            if (relation.inputs.length !== 0) {
                relation.outputs.forEach(function(outputDataStr) {
                    var output = JSON.parse(outputDataStr);
                    var element = box.getDataById(output.id);
                    var inputs = element.getClient('inputs') || [];
                    var insertInput = relation.inputs[0];
                    if (inputs.map(function (inputItem) {
                        return inputItem.id;
                    }).indexOf(insertInput) === -1) {
                        inputs.push({
                            id: insertInput,
                            y: output.y
                        })
                    }
                    element.setClient('inputs', inputs);
                });
                relation.lines.forEach(function (element) {
                    element.setClient('inputs', relation.inputs[0]);
                });
            }
        });

        box.getDatas().forEach(function (element) {
            var inputs = element.getClient('inputs');
            if (Array.isArray(inputs) && inputs.length > 0 && typeof inputs[0] === 'object' && inputs[0] !== null) {
                inputs = inputs.sort(function (item1, item2) {
                    return item1.y - item2.y
                }).map(function(item) {
                    return item.id
                });

                element.setClient('inputs', inputs);
            }
        })

        network.startZoomOverView();
    }

    $(".play-btn").on('click', function () {
        var data = [
            {
                "x": 7,
                "y": 16,
                "name": "tIn1",
                "nameX": 7,
                "nameY": 15,
                "height": 2,
                "width": 4,
                "sign": "零序跳闸",
                "type1": "TempInput",
                "type1X": 7,
                "type1Y": 15,
                "type2": "",
                "id": -1,
                "inputNum": 0,
                "notGateNum": 0,
                "showName": false,
                "showType": false,
                "showResult": false,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 7,
                "y": 20,
                "name": "tIn2",
                "nameX": 7,
                "nameY": 19,
                "height": 2,
                "width": 4,
                "sign": "加速跳闸",
                "type1": "TempInput",
                "type1X": 7,
                "type1Y": 19,
                "type2": "",
                "id": -1,
                "inputNum": 0,
                "notGateNum": 0,
                "showName": false,
                "showType": false,
                "showResult": false,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 7,
                "y": 24,
                "name": "tIn3",
                "nameX": 7,
                "nameY": 23,
                "height": 2,
                "width": 4,
                "sign": "过流跳闸",
                "type1": "TempInput",
                "type1X": 7,
                "type1Y": 23,
                "type2": "",
                "id": -1,
                "inputNum": 0,
                "notGateNum": 0,
                "showName": false,
                "showType": false,
                "showResult": false,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 7,
                "y": 37,
                "name": "tIn4",
                "nameX": 7,
                "nameY": 36,
                "height": 2,
                "width": 4,
                "sign": "零序启动",
                "type1": "TempInput",
                "type1X": 7,
                "type1Y": 36,
                "type2": "",
                "id": -1,
                "inputNum": 0,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 7,
                "y": 41,
                "name": "tIn5",
                "nameX": 7,
                "nameY": 40,
                "height": 2,
                "width": 4,
                "sign": "过流启动",
                "type1": "TempInput",
                "type1X": 7,
                "type1Y": 40,
                "type2": "",
                "id": -1,
                "inputNum": 0,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 7,
                "y": 45,
                "name": "tIn6",
                "nameX": 7,
                "nameY": 44,
                "height": 2,
                "width": 4,
                "sign": "重合启动",
                "type1": "TempInput",
                "type1X": 7,
                "type1Y": 44,
                "type2": "",
                "id": -1,
                "inputNum": 0,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 22,
                "y": 40,
                "name": "H1",
                "nameX": 22,
                "nameY": 39,
                "height": 8,
                "width": 2,
                "sign": "",
                "type1": "Or",
                "type1X": 22,
                "type1Y": 39,
                "type2": "",
                "id": 235,
                "inputNum": 7,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 80,
                "y": 43,
                "name": "Out1",
                "nameX": 80,
                "nameY": 42,
                "height": 2,
                "width": 4,
                "sign": "保护启动",
                "type1": "Output",
                "type1X": 80,
                "type1Y": 42,
                "type2": "",
                "id": 236,
                "inputNum": 1,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": true,
                    "events": [
                        "67-保护启动"
                    ],
                    "waveLength": 300,
                    "triggerType": 0,
                    "state": true,
                    "statusNumber": 0
                }
            },
            {
                "x": 40,
                "y": 43,
                "name": "T1",
                "nameX": 40,
                "nameY": 42,
                "height": 2,
                "width": 2,
                "sign": "0/3s",
                "type1": "Time",
                "type1X": 40,
                "type1Y": 42,
                "type2": "ConstantTime",
                "id": 237,
                "inputNum": 1,
                "notGateNum": 0,
                "showName": false,
                "showType": false,
                "showResult": false,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 22,
                "y": 21,
                "name": "H2",
                "nameX": 22,
                "nameY": 20,
                "height": 4,
                "width": 2,
                "sign": "",
                "type1": "Or",
                "type1X": 22,
                "type1Y": 20,
                "type2": "",
                "id": 238,
                "inputNum": 3,
                "notGateNum": 0,
                "showName": false,
                "showType": false,
                "showResult": false,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 39,
                "y": 16,
                "name": "Y1",
                "nameX": 39,
                "nameY": 15,
                "height": 4,
                "width": 2,
                "sign": "",
                "type1": "And",
                "type1X": 39,
                "type1Y": 15,
                "type2": "",
                "id": 239,
                "inputNum": 2,
                "notGateNum": 1,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 67,
                "y": 30,
                "name": "Y2",
                "nameX": 67,
                "nameY": 29,
                "height": 4,
                "width": 2,
                "sign": "",
                "type1": "And",
                "type1X": 67,
                "type1Y": 29,
                "type2": "",
                "id": 240,
                "inputNum": 3,
                "notGateNum": 2,
                "showName": true,
                "showType": false,
                "showResult": false,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 46,
                "y": 21,
                "name": "H3",
                "nameX": 46,
                "nameY": 20,
                "height": 4,
                "width": 2,
                "sign": "",
                "type1": "Or",
                "type1X": 46,
                "type1Y": 20,
                "type2": "",
                "id": 241,
                "inputNum": 3,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 30,
                "y": 16,
                "name": "T2",
                "nameX": 30,
                "nameY": 15,
                "height": 2,
                "width": 2,
                "sign": "40/0",
                "type1": "Time",
                "type1X": 30,
                "type1Y": 15,
                "type2": "ConstantTime",
                "id": 242,
                "inputNum": 1,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 67,
                "y": 20,
                "name": "Y3",
                "nameX": 67,
                "nameY": 19,
                "height": 4,
                "width": 2,
                "sign": "",
                "type1": "And",
                "type1X": 67,
                "type1Y": 19,
                "type2": "",
                "id": 243,
                "inputNum": 2,
                "notGateNum": 1,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 80,
                "y": 21,
                "name": "Out2",
                "nameX": 80,
                "nameY": 20,
                "height": 2,
                "width": 2,
                "sign": "跳闸",
                "type1": "Output",
                "type1X": 80,
                "type1Y": 20,
                "type2": "",
                "id": 244,
                "inputNum": 1,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": true,
                    "events": [
                        "60-低周动作",
                        "62-接地选跳动作",
                        "66-零序加速段动作",
                        "68-低压解列动作"
                    ],
                    "waveLength": 300,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 80,
                "y": 16,
                "name": "Out3",
                "nameX": 80,
                "nameY": 15,
                "height": 2,
                "width": 5,
                "sign": "报告跳闸失败",
                "type1": "Output",
                "type1X": 80,
                "type1Y": 15,
                "type2": "",
                "id": 245,
                "inputNum": 1,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": true,
                    "events": [
                        "33-跳闸失败"
                    ],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 7,
                "y": 56,
                "name": "tIn7",
                "nameX": 7,
                "nameY": 55,
                "height": 2,
                "width": 2,
                "sign": "Iw<",
                "type1": "TempInput",
                "type1X": 7,
                "type1Y": 55,
                "type2": "",
                "id": -1,
                "inputNum": 0,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 7,
                "y": 61,
                "name": "In1",
                "nameX": 7,
                "nameY": 60,
                "height": 2,
                "width": 2,
                "sign": "FDZ<",
                "type1": "Input",
                "type1X": 7,
                "type1Y": 60,
                "type2": "",
                "id": 246,
                "inputNum": 0,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 7,
                "y": 68,
                "name": "In2",
                "nameX": 7,
                "nameY": 67,
                "height": 2,
                "width": 2,
                "sign": "df/dt>",
                "type1": "Input",
                "type1X": 7,
                "type1Y": 67,
                "type2": "",
                "id": 247,
                "inputNum": 0,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 7,
                "y": 72,
                "name": "In3",
                "nameX": 7,
                "nameY": 71,
                "height": 2,
                "width": 3,
                "sign": "F<45Hz",
                "type1": "Input",
                "type1X": 7,
                "type1Y": 71,
                "type2": "",
                "id": 248,
                "inputNum": 0,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 7,
                "y": 76,
                "name": "In4",
                "nameX": 7,
                "nameY": 75,
                "height": 2,
                "width": 2,
                "sign": "UDZ<",
                "type1": "Input",
                "type1X": 7,
                "type1Y": 75,
                "type2": "",
                "id": 249,
                "inputNum": 0,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 7,
                "y": 80,
                "name": "In5",
                "nameX": 7,
                "nameY": 79,
                "height": 2,
                "width": 3,
                "sign": "Iabc<0.1In",
                "type1": "Input",
                "type1X": 7,
                "type1Y": 79,
                "type2": "",
                "id": 250,
                "inputNum": 0,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 39,
                "y": 59,
                "name": "Y4",
                "nameX": 39,
                "nameY": 58,
                "height": 4,
                "width": 2,
                "sign": "",
                "type1": "And",
                "type1X": 39,
                "type1Y": 58,
                "type2": "",
                "id": 251,
                "inputNum": 2,
                "notGateNum": 1,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 15,
                "y": 64,
                "name": "Y5",
                "nameX": 15,
                "nameY": 63,
                "height": 4,
                "width": 2,
                "sign": "",
                "type1": "And",
                "type1X": 15,
                "type1Y": 63,
                "type2": "",
                "id": 252,
                "inputNum": 2,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 23,
                "y": 65,
                "name": "H4",
                "nameX": 23,
                "nameY": 64,
                "height": 4,
                "width": 2,
                "sign": "",
                "type1": "Or",
                "type1X": 23,
                "type1Y": 64,
                "type2": "",
                "id": 253,
                "inputNum": 2,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 31,
                "y": 72,
                "name": "H5",
                "nameX": 31,
                "nameY": 71,
                "height": 6,
                "width": 2,
                "sign": "",
                "type1": "Or",
                "type1X": 31,
                "type1Y": 71,
                "type2": "",
                "id": 254,
                "inputNum": 5,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 7,
                "y": 84,
                "name": "tIn8",
                "nameX": 7,
                "nameY": 83,
                "height": 2,
                "width": 4,
                "sign": "PT断线动作",
                "type1": "TempInput",
                "type1X": 7,
                "type1Y": 83,
                "type2": "",
                "id": -1,
                "inputNum": 0,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 47,
                "y": 60,
                "name": "YB1",
                "nameX": 47,
                "nameY": 58,
                "height": 2,
                "width": 2,
                "sign": "低周减载",
                "type1": "YB",
                "type1X": 47,
                "type1Y": 59,
                "type2": "",
                "id": 255,
                "inputNum": 1,
                "notGateNum": 0,
                "showName": false,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 55,
                "y": 60,
                "name": "T4",
                "nameX": 55,
                "nameY": 59,
                "height": 2,
                "width": 2,
                "sign": "TDZ/0",
                "type1": "Time",
                "type1X": 55,
                "type1Y": 59,
                "type2": "SettingTime",
                "id": 256,
                "inputNum": 1,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": true,
                    "events": [
                        "60-低周动作"
                    ],
                    "waveLength": 300,
                    "triggerType": 1,
                    "state": true,
                    "statusNumber": 0
                }
            },
            {
                "x": 71,
                "y": 76,
                "name": "tOut1",
                "nameX": 71,
                "nameY": 75,
                "height": 2,
                "width": 2,
                "sign": "永跳",
                "type1": "TempOutput",
                "type1X": 71,
                "type1Y": 75,
                "type2": "",
                "id": -1,
                "inputNum": 1,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 7,
                "y": 90,
                "name": "In6",
                "nameX": 7,
                "nameY": 89,
                "height": 2,
                "width": 3,
                "sign": "过负荷",
                "type1": "Input",
                "type1X": 7,
                "type1Y": 89,
                "type2": "",
                "id": 257,
                "inputNum": 0,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 15,
                "y": 90,
                "name": "YB2",
                "nameX": 15,
                "nameY": 88,
                "height": 2,
                "width": 2,
                "sign": "过负荷",
                "type1": "YB",
                "type1X": 15,
                "type1Y": 89,
                "type2": "",
                "id": 258,
                "inputNum": 1,
                "notGateNum": 0,
                "showName": false,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 31,
                "y": 90,
                "name": "T5",
                "nameX": 31,
                "nameY": 89,
                "height": 2,
                "width": 2,
                "sign": "TFT/0",
                "type1": "Time",
                "type1X": 31,
                "type1Y": 89,
                "type2": "SettingTime",
                "id": 259,
                "inputNum": 1,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": true,
                    "events": [
                        "61-过负荷动作"
                    ],
                    "waveLength": 300,
                    "triggerType": 1,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 23,
                "y": 95,
                "name": "T6",
                "nameX": 23,
                "nameY": 94,
                "height": 2,
                "width": 2,
                "sign": "TFG/0",
                "type1": "Time",
                "type1X": 23,
                "type1Y": 94,
                "type2": "SettingTime",
                "id": 260,
                "inputNum": 1,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 23,
                "y": 90,
                "name": "KG1",
                "nameX": 23,
                "nameY": 88,
                "height": 2,
                "width": 2,
                "sign": "KG2.13",
                "type1": "KG",
                "type1X": 23,
                "type1Y": 89,
                "type2": "01",
                "id": 261,
                "inputNum": 1,
                "notGateNum": 0,
                "showName": false,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 31,
                "y": 95,
                "name": "Out4",
                "nameX": 31,
                "nameY": 94,
                "height": 2,
                "width": 5,
                "sign": "过负荷告警",
                "type1": "Output",
                "type1X": 31,
                "type1Y": 94,
                "type2": "",
                "id": 262,
                "inputNum": 1,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": true,
                    "events": [
                        "36-过负荷告警"
                    ],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 63,
                "y": 75,
                "name": "H6",
                "nameX": 63,
                "nameY": 74,
                "height": 4,
                "width": 2,
                "sign": "",
                "type1": "Or",
                "type1X": 63,
                "type1Y": 74,
                "type2": "",
                "id": 263,
                "inputNum": 3,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 63,
                "y": 89,
                "name": "H7",
                "nameX": 63,
                "nameY": 88,
                "height": 4,
                "width": 2,
                "sign": "",
                "type1": "Or",
                "type1X": 63,
                "type1Y": 88,
                "type2": "",
                "id": 264,
                "inputNum": 3,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 70,
                "y": 90,
                "name": "tOut2",
                "nameX": 70,
                "nameY": 89,
                "height": 2,
                "width": 4,
                "sign": "低周启动",
                "type1": "TempOutput",
                "type1X": 70,
                "type1Y": 89,
                "type2": "",
                "id": -1,
                "inputNum": 1,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 8,
                "y": 28,
                "name": "tIn9",
                "nameX": 8,
                "nameY": 27,
                "height": 2,
                "width": 2,
                "sign": "永跳",
                "type1": "TempInput",
                "type1X": 8,
                "type1Y": 27,
                "type2": "",
                "id": -1,
                "inputNum": 0,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 7,
                "y": 49,
                "name": "tIn10",
                "nameX": 7,
                "nameY": 48,
                "height": 2,
                "width": 4,
                "sign": "低周启动",
                "type1": "TempInput",
                "type1X": 7,
                "type1Y": 48,
                "type2": "",
                "id": -1,
                "inputNum": 0,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 7,
                "y": 106,
                "name": "In7",
                "nameX": 7,
                "nameY": 105,
                "height": 2,
                "width": 2,
                "sign": "3U0>",
                "type1": "Input",
                "type1X": 7,
                "type1Y": 105,
                "type2": "",
                "id": 265,
                "inputNum": 0,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 7,
                "y": 110,
                "name": "tIn11",
                "nameX": 7,
                "nameY": 109,
                "height": 2,
                "width": 2,
                "sign": "TWJ",
                "type1": "TempInput",
                "type1X": 7,
                "type1Y": 109,
                "type2": "",
                "id": -1,
                "inputNum": 0,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 15,
                "y": 101,
                "name": "Y6",
                "nameX": 15,
                "nameY": 100,
                "height": 6,
                "width": 2,
                "sign": "",
                "type1": "And",
                "type1X": 15,
                "type1Y": 100,
                "type2": "",
                "id": 266,
                "inputNum": 4,
                "notGateNum": 3,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 23,
                "y": 103,
                "name": "T8",
                "nameX": 23,
                "nameY": 102,
                "height": 2,
                "width": 2,
                "sign": "200/0",
                "type1": "Time",
                "type1X": 23,
                "type1Y": 102,
                "type2": "ConstantTime",
                "id": 267,
                "inputNum": 1,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 23,
                "y": 114,
                "name": "Y7",
                "nameX": 23,
                "nameY": 113,
                "height": 4,
                "width": 2,
                "sign": "",
                "type1": "And",
                "type1X": 23,
                "type1Y": 113,
                "type2": "",
                "id": 268,
                "inputNum": 2,
                "notGateNum": 1,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 31,
                "y": 115,
                "name": "T7",
                "nameX": 31,
                "nameY": 114,
                "height": 2,
                "width": 2,
                "sign": "100/0",
                "type1": "Time",
                "type1X": 31,
                "type1Y": 114,
                "type2": "ConstantTime",
                "id": 269,
                "inputNum": 1,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 47,
                "y": 106,
                "name": "Y8",
                "nameX": 47,
                "nameY": 105,
                "height": 4,
                "width": 2,
                "sign": "",
                "type1": "And",
                "type1X": 47,
                "type1Y": 105,
                "type2": "",
                "id": 270,
                "inputNum": 2,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 53,
                "y": 107,
                "name": "Out5",
                "nameX": 54,
                "nameY": 106,
                "height": 2,
                "width": 5,
                "sign": "本线路接地",
                "type1": "Output",
                "type1X": 53,
                "type1Y": 106,
                "type2": "",
                "id": 271,
                "inputNum": 1,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": true,
                    "events": [],
                    "waveLength": 300,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 7,
                "y": 102,
                "name": "tIn12",
                "nameX": 7,
                "nameY": 101,
                "height": 2,
                "width": 4,
                "sign": "保护启动",
                "type1": "TempInput",
                "type1X": 7,
                "type1Y": 101,
                "type2": "",
                "id": -1,
                "inputNum": 0,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 32,
                "y": 105,
                "name": "H8",
                "nameX": 32,
                "nameY": 104,
                "height": 4,
                "width": 2,
                "sign": "",
                "type1": "Or",
                "type1X": 32,
                "type1Y": 104,
                "type2": "",
                "id": 272,
                "inputNum": 2,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 23,
                "y": 106,
                "name": "Y9",
                "nameX": 23,
                "nameY": 105,
                "height": 4,
                "width": 2,
                "sign": "",
                "type1": "And",
                "type1X": 23,
                "type1Y": 105,
                "type2": "",
                "id": 273,
                "inputNum": 2,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 39,
                "y": 106,
                "name": "T9",
                "nameX": 39,
                "nameY": 105,
                "height": 2,
                "width": 2,
                "sign": "10/950",
                "type1": "Time",
                "type1X": 39,
                "type1Y": 105,
                "type2": "ConstantTime",
                "id": 274,
                "inputNum": 1,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 7,
                "y": 98,
                "name": "tIn13",
                "nameX": 7,
                "nameY": 97,
                "height": 2,
                "width": 4,
                "sign": "PT断线动作",
                "type1": "TempInput",
                "type1X": 7,
                "type1Y": 97,
                "type2": "",
                "id": -1,
                "inputNum": 0,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 5,
                "y": 9,
                "name": "In8",
                "nameX": 5,
                "nameY": 8,
                "height": 2,
                "width": 6,
                "sign": "接地选跳/开入3",
                "type1": "Input",
                "type1X": 5,
                "type1Y": 8,
                "type2": "",
                "id": 275,
                "inputNum": 0,
                "notGateNum": 0,
                "showName": false,
                "showType": false,
                "showResult": false,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 16,
                "y": 9,
                "name": "T10",
                "nameX": 16,
                "nameY": 8,
                "height": 2,
                "width": 2,
                "sign": "100/0",
                "type1": "Time",
                "type1X": 16,
                "type1Y": 8,
                "type2": "ConstantTime",
                "id": 276,
                "inputNum": 1,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": true,
                    "events": [
                        "62-接地选跳动作"
                    ],
                    "waveLength": 300,
                    "triggerType": 1,
                    "state": true,
                    "statusNumber": 0
                }
            },
            {
                "x": 24,
                "y": 9,
                "name": "tOut3",
                "nameX": 24,
                "nameY": 8,
                "height": 2,
                "width": 5,
                "sign": "接地选跳输入",
                "type1": "TempOutput",
                "type1X": 24,
                "type1Y": 8,
                "type2": "",
                "id": -1,
                "inputNum": 1,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 34,
                "y": 9,
                "name": "T11",
                "nameX": 34,
                "nameY": 8,
                "height": 2,
                "width": 2,
                "sign": "10s/0",
                "type1": "Time",
                "type1X": 34,
                "type1Y": 8,
                "type2": "ConstantTime",
                "id": 277,
                "inputNum": 1,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 42,
                "y": 9,
                "name": "Out6",
                "nameX": 42,
                "nameY": 8,
                "height": 2,
                "width": 6,
                "sign": "接地选跳开入错",
                "type1": "Output",
                "type1X": 42,
                "type1Y": 8,
                "type2": "",
                "id": 278,
                "inputNum": 1,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 80,
                "y": 26,
                "name": "Out8",
                "nameX": 80,
                "nameY": 24,
                "height": 2,
                "width": 5,
                "sign": "保护动作信号",
                "type1": "Output",
                "type1X": 80,
                "type1Y": 25,
                "type2": "",
                "id": 279,
                "inputNum": 1,
                "notGateNum": 0,
                "showName": true,
                "showType": true,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 74,
                "y": 25,
                "name": "H9",
                "nameX": 74,
                "nameY": 23,
                "height": 4,
                "width": 2,
                "sign": "",
                "type1": "Or",
                "type1X": 74,
                "type1Y": 24,
                "type2": "",
                "id": 280,
                "inputNum": 2,
                "notGateNum": 0,
                "showName": true,
                "showType": true,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 55,
                "y": 17,
                "name": "T3",
                "nameX": 55,
                "nameY": 15,
                "height": 2,
                "width": 2,
                "sign": "9s/0",
                "type1": "Time",
                "type1X": 55,
                "type1Y": 16,
                "type2": "ConstantTime",
                "id": 281,
                "inputNum": 1,
                "notGateNum": 0,
                "showName": true,
                "showType": true,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 61,
                "y": 27,
                "name": "In11",
                "nameX": 61,
                "nameY": 25,
                "height": 2,
                "width": 4,
                "sign": "重合信号",
                "type1": "TempInput",
                "type1X": 61,
                "type1Y": 26,
                "type2": "",
                "id": -1,
                "inputNum": 0,
                "notGateNum": 0,
                "showName": true,
                "showType": true,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 7,
                "y": 119,
                "name": "In12",
                "nameX": 7,
                "nameY": 117,
                "height": 2,
                "width": 2,
                "sign": "UDY<",
                "type1": "Input",
                "type1X": 7,
                "type1Y": 118,
                "type2": "",
                "id": 282,
                "inputNum": 0,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 7,
                "y": 126,
                "name": "In13",
                "nameX": 7,
                "nameY": 125,
                "height": 2,
                "width": 3,
                "sign": "|dU/dt|>",
                "type1": "Input",
                "type1X": 7,
                "type1Y": 125,
                "type2": "",
                "id": 283,
                "inputNum": 0,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 7,
                "y": 130,
                "name": "In14",
                "nameX": 7,
                "nameY": 129,
                "height": 2,
                "width": 3,
                "sign": "U相<12V",
                "type1": "Input",
                "type1X": 7,
                "type1Y": 129,
                "type2": "",
                "id": 284,
                "inputNum": 0,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 7,
                "y": 134,
                "name": "In15",
                "nameX": 7,
                "nameY": 133,
                "height": 2,
                "width": 4,
                "sign": "负序U2>5V",
                "type1": "Input",
                "type1X": 7,
                "type1Y": 133,
                "type2": "",
                "id": 285,
                "inputNum": 0,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 7,
                "y": 138,
                "name": "In16",
                "nameX": 7,
                "nameY": 137,
                "height": 2,
                "width": 3,
                "sign": "Iabc<0.1In",
                "type1": "TempInput",
                "type1X": 7,
                "type1Y": 137,
                "type2": "",
                "id": -1,
                "inputNum": 0,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 7,
                "y": 142,
                "name": "In17",
                "nameX": 7,
                "nameY": 141,
                "height": 2,
                "width": 4,
                "sign": "PT断线动作",
                "type1": "TempInput",
                "type1X": 7,
                "type1Y": 141,
                "type2": "",
                "id": -1,
                "inputNum": 0,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 37,
                "y": 118,
                "name": "Y12",
                "nameX": 37,
                "nameY": 117,
                "height": 4,
                "width": 2,
                "sign": "",
                "type1": "And",
                "type1X": 37,
                "type1Y": 117,
                "type2": "",
                "id": 286,
                "inputNum": 2,
                "notGateNum": 1,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 22,
                "y": 123,
                "name": "H10",
                "nameX": 22,
                "nameY": 122,
                "height": 4,
                "width": 2,
                "sign": "",
                "type1": "Or",
                "type1X": 22,
                "type1Y": 122,
                "type2": "",
                "id": 287,
                "inputNum": 2,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 30,
                "y": 129,
                "name": "H11",
                "nameX": 30,
                "nameY": 127,
                "height": 6,
                "width": 2,
                "sign": "",
                "type1": "Or",
                "type1X": 30,
                "type1Y": 128,
                "type2": "",
                "id": 288,
                "inputNum": 5,
                "notGateNum": 0,
                "showName": true,
                "showType": true,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 15,
                "y": 122,
                "name": "Y11",
                "nameX": 15,
                "nameY": 121,
                "height": 4,
                "width": 2,
                "sign": "",
                "type1": "And",
                "type1X": 15,
                "type1Y": 121,
                "type2": "",
                "id": 289,
                "inputNum": 2,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 51,
                "y": 119,
                "name": "T13",
                "nameX": 51,
                "nameY": 117,
                "height": 2,
                "width": 2,
                "sign": "TDY/0",
                "type1": "Time",
                "type1X": 51,
                "type1Y": 118,
                "type2": "SettingTime",
                "id": 290,
                "inputNum": 1,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": true,
                    "events": [
                        "68-低压解列动作"
                    ],
                    "waveLength": 300,
                    "triggerType": 1,
                    "state": true,
                    "statusNumber": 0
                }
            },
            {
                "x": 44,
                "y": 119,
                "name": "KG2",
                "nameX": 44,
                "nameY": 117,
                "height": 2,
                "width": 2,
                "sign": "KG2.8",
                "type1": "KG",
                "type1X": 44,
                "type1Y": 118,
                "type2": "01",
                "id": 291,
                "inputNum": 1,
                "notGateNum": 0,
                "showName": false,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 7,
                "y": 53,
                "name": "In10",
                "nameX": 7,
                "nameY": 52,
                "height": 2,
                "width": 4,
                "sign": "加速启动",
                "type1": "TempInput",
                "type1X": 7,
                "type1Y": 52,
                "type2": "",
                "id": -1,
                "inputNum": 0,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 40,
                "y": 126,
                "name": "In18",
                "nameX": 40,
                "nameY": 124,
                "height": 2,
                "width": 3,
                "sign": "Ux<0.3Uxn",
                "type1": "TempInput",
                "type1X": 40,
                "type1Y": 125,
                "type2": "",
                "id": -1,
                "inputNum": 0,
                "notGateNum": 0,
                "showName": false,
                "showType": false,
                "showResult": false,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 39,
                "y": 133,
                "name": "In22",
                "nameX": 39,
                "nameY": 131,
                "height": 2,
                "width": 5,
                "sign": "频率差闭锁",
                "type1": "Input",
                "type1X": 39,
                "type1Y": 132,
                "type2": "",
                "id": 292,
                "inputNum": 0,
                "notGateNum": 0,
                "showName": false,
                "showType": false,
                "showResult": false,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 39,
                "y": 136,
                "name": "In23",
                "nameX": 39,
                "nameY": 134,
                "height": 2,
                "width": 5,
                "sign": "加速度闭锁",
                "type1": "Input",
                "type1X": 39,
                "type1Y": 135,
                "type2": "",
                "id": 293,
                "inputNum": 0,
                "notGateNum": 0,
                "showName": false,
                "showType": false,
                "showResult": false,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 39,
                "y": 130,
                "name": "In24",
                "nameX": 39,
                "nameY": 128,
                "height": 2,
                "width": 5,
                "sign": "电压差闭锁",
                "type1": "Input",
                "type1X": 39,
                "type1Y": 129,
                "type2": "",
                "id": 294,
                "inputNum": 0,
                "notGateNum": 0,
                "showName": false,
                "showType": false,
                "showResult": false,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 39,
                "y": 139,
                "name": "In25",
                "nameX": 39,
                "nameY": 137,
                "height": 2,
                "width": 5,
                "sign": "导前角闭锁",
                "type1": "Input",
                "type1X": 39,
                "type1Y": 138,
                "type2": "",
                "id": 295,
                "inputNum": 0,
                "notGateNum": 0,
                "showName": false,
                "showType": false,
                "showResult": false,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 47,
                "y": 133,
                "name": "H12",
                "nameX": 47,
                "nameY": 131,
                "height": 6,
                "width": 2,
                "sign": "",
                "type1": "Or",
                "type1X": 47,
                "type1Y": 132,
                "type2": "",
                "id": 296,
                "inputNum": 4,
                "notGateNum": 0,
                "showName": false,
                "showType": false,
                "showResult": false,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 54,
                "y": 124,
                "name": "手合开入4",
                "nameX": 54,
                "nameY": 123,
                "height": 2,
                "width": 7,
                "sign": "准同期投入/开入4",
                "type1": "Input",
                "type1X": 54,
                "type1Y": 123,
                "type2": "",
                "id": 297,
                "inputNum": 0,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": false,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 63,
                "y": 132,
                "name": "H13",
                "nameX": 63,
                "nameY": 130,
                "height": 4,
                "width": 2,
                "sign": "",
                "type1": "Or",
                "type1X": 63,
                "type1Y": 131,
                "type2": "",
                "id": 298,
                "inputNum": 2,
                "notGateNum": 0,
                "showName": false,
                "showType": false,
                "showResult": false,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 75,
                "y": 128,
                "name": "KG2.12'",
                "nameX": 75,
                "nameY": 127,
                "height": 2,
                "width": 2,
                "sign": "KG2.12",
                "type1": "KG",
                "type1X": 75,
                "type1Y": 127,
                "type2": "01",
                "id": 299,
                "inputNum": 1,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": false,
                "event": {
                    "isEvent": true,
                    "events": [
                        "69-准同期合闸动作"
                    ],
                    "waveLength": 80,
                    "triggerType": 1,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 70,
                "y": 127,
                "name": "Y14",
                "nameX": 70,
                "nameY": 125,
                "height": 4,
                "width": 2,
                "sign": "",
                "type1": "And",
                "type1X": 70,
                "type1Y": 126,
                "type2": "",
                "id": 300,
                "inputNum": 3,
                "notGateNum": 0,
                "showName": false,
                "showType": false,
                "showResult": false,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 81,
                "y": 123,
                "name": "Out10",
                "nameX": 81,
                "nameY": 121,
                "height": 2,
                "width": 5,
                "sign": "准同期启动",
                "type1": "TempOutput",
                "type1X": 81,
                "type1Y": 122,
                "type2": "",
                "id": -1,
                "inputNum": 1,
                "notGateNum": 0,
                "showName": false,
                "showType": false,
                "showResult": false,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 11,
                "y": 43,
                "name": "In20",
                "nameX": 11,
                "nameY": 41,
                "height": 2,
                "width": 5,
                "sign": "准同期启动",
                "type1": "TempInput",
                "type1X": 11,
                "type1Y": 42,
                "type2": "",
                "id": -1,
                "inputNum": 0,
                "notGateNum": 0,
                "showName": false,
                "showType": false,
                "showResult": false,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 64,
                "y": 125,
                "name": "T12",
                "nameX": 64,
                "nameY": 123,
                "height": 2,
                "width": 3,
                "sign": "5/60000",
                "type1": "Time",
                "type1X": 64,
                "type1Y": 124,
                "type2": "ConstantTime",
                "id": 301,
                "inputNum": 1,
                "notGateNum": 0,
                "showName": false,
                "showType": false,
                "showResult": false,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 61,
                "y": 128,
                "name": "In21",
                "nameX": 61,
                "nameY": 126,
                "height": 2,
                "width": 2,
                "sign": "TWJ",
                "type1": "TempInput",
                "type1X": 61,
                "type1Y": 127,
                "type2": "",
                "id": -1,
                "inputNum": 0,
                "notGateNum": 0,
                "showName": false,
                "showType": false,
                "showResult": false,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 81,
                "y": 128,
                "name": "Out9",
                "nameX": 81,
                "nameY": 126,
                "height": 2,
                "width": 4,
                "sign": "备用出口23",
                "type1": "Output",
                "type1X": 81,
                "type1Y": 127,
                "type2": "",
                "id": 302,
                "inputNum": 1,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": true,
                "event": {
                    "isEvent": true,
                    "events": [
                        "69-准同期合闸动作"
                    ],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": true,
                    "statusNumber": 0
                }
            },
            {
                "x": 15,
                "y": 19,
                "name": "H14",
                "nameX": 15,
                "nameY": 17,
                "height": 4,
                "width": 2,
                "sign": "",
                "type1": "Or",
                "type1X": 15,
                "type1Y": 18,
                "type2": "",
                "id": 303,
                "inputNum": 3,
                "notGateNum": 0,
                "showName": false,
                "showType": false,
                "showResult": false,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 23,
                "y": 18,
                "name": "Out11",
                "nameX": 23,
                "nameY": 16,
                "height": 2,
                "width": 4,
                "sign": "保护瞬动",
                "type1": "TempOutput",
                "type1X": 23,
                "type1Y": 17,
                "type2": "",
                "id": -1,
                "inputNum": 1,
                "notGateNum": 0,
                "showName": false,
                "showType": false,
                "showResult": false,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 51,
                "y": 126,
                "name": "KG2.1",
                "nameX": 51,
                "nameY": 125,
                "height": 2,
                "width": 2,
                "sign": "KG2.1",
                "type1": "KG",
                "type1X": 51,
                "type1Y": 125,
                "type2": "01",
                "id": 304,
                "inputNum": 1,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": false,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 47,
                "y": 140,
                "name": "In26",
                "nameX": 47,
                "nameY": 138,
                "height": 2,
                "width": 4,
                "sign": "Ux>0.75Uxn",
                "type1": "TempInput",
                "type1X": 47,
                "type1Y": 139,
                "type2": "",
                "id": -1,
                "inputNum": 0,
                "notGateNum": 0,
                "showName": false,
                "showType": false,
                "showResult": false,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 50,
                "y": 143,
                "name": "In27",
                "nameX": 50,
                "nameY": 141,
                "height": 2,
                "width": 4,
                "sign": "Up>0.75Un",
                "type1": "TempInput",
                "type1X": 50,
                "type1Y": 142,
                "type2": "",
                "id": -1,
                "inputNum": 0,
                "notGateNum": 0,
                "showName": false,
                "showType": false,
                "showResult": false,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 56,
                "y": 135,
                "name": "Y15",
                "nameX": 56,
                "nameY": 133,
                "height": 4,
                "width": 2,
                "sign": "",
                "type1": "And",
                "type1X": 56,
                "type1Y": 134,
                "type2": "",
                "id": 305,
                "inputNum": 3,
                "notGateNum": 1,
                "showName": false,
                "showType": false,
                "showResult": false,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 43,
                "y": 87,
                "name": "Out12",
                "nameX": 43,
                "nameY": 85,
                "height": 2,
                "width": 2,
                "sign": "报告8",
                "type1": "Output",
                "type1X": 43,
                "type1Y": 86,
                "type2": "",
                "id": 306,
                "inputNum": 1,
                "notGateNum": 0,
                "showName": false,
                "showType": false,
                "showResult": false,
                "event": {
                    "isEvent": true,
                    "events": [
                        "61-过负荷动作"
                    ],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": true,
                    "statusNumber": 0
                }
            },
            {
                "x": 37,
                "y": 86,
                "name": "Y10",
                "nameX": 37,
                "nameY": 84,
                "height": 4,
                "width": 2,
                "sign": "",
                "type1": "And",
                "type1X": 37,
                "type1Y": 85,
                "type2": "",
                "id": 307,
                "inputNum": 2,
                "notGateNum": 0,
                "showName": false,
                "showType": false,
                "showResult": false,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 31,
                "y": 84,
                "name": "In9",
                "nameX": 31,
                "nameY": 82,
                "height": 2,
                "width": 4,
                "sign": "保护启动",
                "type1": "TempInput",
                "type1X": 31,
                "type1Y": 83,
                "type2": "",
                "id": -1,
                "inputNum": 0,
                "notGateNum": 0,
                "showName": false,
                "showType": false,
                "showResult": false,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 68,
                "y": 115,
                "name": "In19",
                "nameX": 68,
                "nameY": 114,
                "height": 2,
                "width": 4,
                "sign": "手动跳闸",
                "type1": "Input",
                "type1X": 68,
                "type1Y": 114,
                "type2": "",
                "id": 308,
                "inputNum": 0,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": false,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 78,
                "y": 115,
                "name": "T14",
                "nameX": 78,
                "nameY": 114,
                "height": 2,
                "width": 2,
                "sign": "2/3000",
                "type1": "Time",
                "type1X": 78,
                "type1Y": 114,
                "type2": "ConstantTime",
                "id": 309,
                "inputNum": 1,
                "notGateNum": 0,
                "showName": true,
                "showType": false,
                "showResult": false,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 87,
                "y": 115,
                "name": "Out13",
                "nameX": 87,
                "nameY": 113,
                "height": 2,
                "width": 4,
                "sign": "备用出口4",
                "type1": "Output",
                "type1X": 87,
                "type1Y": 114,
                "type2": "",
                "id": 310,
                "inputNum": 1,
                "notGateNum": 0,
                "showName": false,
                "showType": false,
                "showResult": false,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 80,
                "y": 105,
                "name": "H15",
                "nameX": 80,
                "nameY": 103,
                "height": 6,
                "width": 2,
                "sign": "",
                "type1": "Or",
                "type1X": 80,
                "type1Y": 104,
                "type2": "",
                "id": 311,
                "inputNum": 5,
                "notGateNum": 0,
                "showName": true,
                "showType": true,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 86,
                "y": 107,
                "name": "Out7",
                "nameX": 86,
                "nameY": 105,
                "height": 2,
                "width": 5,
                "sign": "保护告警灯",
                "type1": "Output",
                "type1X": 86,
                "type1Y": 106,
                "type2": "",
                "id": 312,
                "inputNum": 1,
                "notGateNum": 0,
                "showName": true,
                "showType": true,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 65,
                "y": 102,
                "name": "In28",
                "nameX": 65,
                "nameY": 100,
                "height": 2,
                "width": 5,
                "sign": "控制回路断线",
                "type1": "TempInput",
                "type1X": 65,
                "type1Y": 101,
                "type2": "",
                "id": -1,
                "inputNum": 0,
                "notGateNum": 0,
                "showName": true,
                "showType": true,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 65,
                "y": 106,
                "name": "In29",
                "nameX": 65,
                "nameY": 104,
                "height": 2,
                "width": 5,
                "sign": "过负荷告警",
                "type1": "TempInput",
                "type1X": 65,
                "type1Y": 105,
                "type2": "",
                "id": -1,
                "inputNum": 0,
                "notGateNum": 0,
                "showName": true,
                "showType": true,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 65,
                "y": 110,
                "name": "In30",
                "nameX": 65,
                "nameY": 108,
                "height": 2,
                "width": 4,
                "sign": "重合失败",
                "type1": "TempInput",
                "type1X": 65,
                "type1Y": 109,
                "type2": "",
                "id": -1,
                "inputNum": 0,
                "notGateNum": 0,
                "showName": true,
                "showType": true,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 71,
                "y": 112,
                "name": "In31",
                "nameX": 71,
                "nameY": 110,
                "height": 2,
                "width": 5,
                "sign": "报告跳闸失败",
                "type1": "TempInput",
                "type1X": 71,
                "type1Y": 111,
                "type2": "",
                "id": -1,
                "inputNum": 0,
                "notGateNum": 0,
                "showName": true,
                "showType": true,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 65,
                "y": 98,
                "name": "In32",
                "nameX": 65,
                "nameY": 96,
                "height": 2,
                "width": 4,
                "sign": "报告PT断线",
                "type1": "TempInput",
                "type1X": 65,
                "type1Y": 97,
                "type2": "",
                "id": -1,
                "inputNum": 0,
                "notGateNum": 0,
                "showName": true,
                "showType": true,
                "showResult": true,
                "event": {
                    "isEvent": false,
                    "events": [],
                    "waveLength": 80,
                    "triggerType": 0,
                    "state": false,
                    "statusNumber": 0
                }
            },
            {
                "x": 66,
                "y": 18,
                "type1": "LinkPoint"
            },
            {
                "x": 53,
                "y": 23,
                "type1": "LinkPoint"
            },
            {
                "x": 35,
                "y": 13,
                "type1": "LinkPoint"
            },
            {
                "x": 53,
                "y": 18,
                "type1": "LinkPoint"
            },
            {
                "x": 11,
                "y": 62,
                "type1": "LinkPoint"
            },
            {
                "x": 28,
                "y": 67,
                "type1": "LinkPoint"
            },
            {
                "x": 20,
                "y": 91,
                "type1": "LinkPoint"
            },
            {
                "x": 52,
                "y": 61,
                "type1": "LinkPoint"
            },
            {
                "x": 56,
                "y": 91,
                "type1": "LinkPoint"
            },
            {
                "x": 43,
                "y": 107,
                "type1": "LinkPoint"
            },
            {
                "x": 13,
                "y": 108,
                "type1": "LinkPoint"
            },
            {
                "x": 20,
                "y": 108,
                "type1": "LinkPoint"
            },
            {
                "x": 12,
                "y": 111,
                "type1": "LinkPoint"
            },
            {
                "x": 20,
                "y": 10,
                "type1": "LinkPoint"
            },
            {
                "x": 20,
                "y": 23,
                "type1": "LinkPoint"
            },
            {
                "x": 20,
                "y": 23,
                "type1": "LinkPoint"
            },
            {
                "x": 72,
                "y": 22,
                "type1": "LinkPoint"
            },
            {
                "x": 11,
                "y": 120,
                "type1": "LinkPoint"
            },
            {
                "x": 26,
                "y": 125,
                "type1": "LinkPoint"
            },
            {
                "x": 48,
                "y": 120,
                "type1": "LinkPoint"
            },
            {
                "x": 19,
                "y": 21,
                "type1": "LinkPoint"
            },
            {
                "x": 59,
                "y": 18,
                "type1": "LinkPoint"
            },
            {
                "x": 36,
                "y": 91,
                "type1": "LinkPoint"
            },
            {
                "x": 47,
                "y": 59,
                "type1": "Text",
                "sign": "低周减载"
            },
            {
                "x": 15,
                "y": 89,
                "type1": "Text",
                "sign": "过负荷"
            },
            {
                "x": 23,
                "y": 89,
                "type1": "Text",
                "sign": "KG2.13"
            },
            {
                "x": 49,
                "y": 4,
                "type1": "Text",
                "sign": "跳闸.grp"
            },
            {
                "x": 44,
                "y": 118,
                "type1": "Text",
                "sign": "KG2.8"
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 25,
                        "y": 44
                    },
                    {
                        "x": 39,
                        "y": 44
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 43,
                        "y": 44
                    },
                    {
                        "x": 79,
                        "y": 44
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 25,
                        "y": 23
                    },
                    {
                        "x": 45,
                        "y": 23
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 70,
                        "y": 22
                    },
                    {
                        "x": 79,
                        "y": 22
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 58,
                        "y": 18
                    },
                    {
                        "x": 66,
                        "y": 18
                    },
                    {
                        "x": 66,
                        "y": 21
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 66,
                        "y": 18
                    },
                    {
                        "x": 66,
                        "y": 17
                    },
                    {
                        "x": 79,
                        "y": 17
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 49,
                        "y": 23
                    },
                    {
                        "x": 66,
                        "y": 23
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 53,
                        "y": 23
                    },
                    {
                        "x": 53,
                        "y": 18
                    },
                    {
                        "x": 54,
                        "y": 18
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 70,
                        "y": 32
                    },
                    {
                        "x": 73,
                        "y": 32
                    },
                    {
                        "x": 73,
                        "y": 35
                    },
                    {
                        "x": 44,
                        "y": 35
                    },
                    {
                        "x": 44,
                        "y": 24
                    },
                    {
                        "x": 45,
                        "y": 24
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 53,
                        "y": 23
                    },
                    {
                        "x": 53,
                        "y": 33
                    },
                    {
                        "x": 66,
                        "y": 33
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 45,
                        "y": 18
                    },
                    {
                        "x": 45,
                        "y": 13
                    },
                    {
                        "x": 27,
                        "y": 13
                    },
                    {
                        "x": 27,
                        "y": 17
                    },
                    {
                        "x": 29,
                        "y": 17
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 35,
                        "y": 13
                    },
                    {
                        "x": 35,
                        "y": 19
                    },
                    {
                        "x": 38,
                        "y": 19
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 33,
                        "y": 17
                    },
                    {
                        "x": 38,
                        "y": 17
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 53,
                        "y": 18
                    },
                    {
                        "x": 45,
                        "y": 18
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 10,
                        "y": 57
                    },
                    {
                        "x": 61,
                        "y": 57
                    },
                    {
                        "x": 61,
                        "y": 32
                    },
                    {
                        "x": 66,
                        "y": 32
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 42,
                        "y": 18
                    },
                    {
                        "x": 42,
                        "y": 22
                    },
                    {
                        "x": 45,
                        "y": 22
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 18,
                        "y": 66
                    },
                    {
                        "x": 22,
                        "y": 66
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 10,
                        "y": 69
                    },
                    {
                        "x": 20,
                        "y": 69
                    },
                    {
                        "x": 20,
                        "y": 68
                    },
                    {
                        "x": 22,
                        "y": 68
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 26,
                        "y": 67
                    },
                    {
                        "x": 28,
                        "y": 67
                    },
                    {
                        "x": 28,
                        "y": 73
                    },
                    {
                        "x": 30,
                        "y": 73
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 11,
                        "y": 73
                    },
                    {
                        "x": 26,
                        "y": 73
                    },
                    {
                        "x": 26,
                        "y": 74
                    },
                    {
                        "x": 30,
                        "y": 74
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 10,
                        "y": 77
                    },
                    {
                        "x": 26,
                        "y": 77
                    },
                    {
                        "x": 26,
                        "y": 75
                    },
                    {
                        "x": 30,
                        "y": 75
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 11,
                        "y": 81
                    },
                    {
                        "x": 27,
                        "y": 81
                    },
                    {
                        "x": 27,
                        "y": 76
                    },
                    {
                        "x": 30,
                        "y": 76
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 12,
                        "y": 85
                    },
                    {
                        "x": 28,
                        "y": 85
                    },
                    {
                        "x": 28,
                        "y": 77
                    },
                    {
                        "x": 30,
                        "y": 77
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 11,
                        "y": 62
                    },
                    {
                        "x": 11,
                        "y": 67
                    },
                    {
                        "x": 14,
                        "y": 67
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 14,
                        "y": 65
                    },
                    {
                        "x": 13,
                        "y": 65
                    },
                    {
                        "x": 13,
                        "y": 63
                    },
                    {
                        "x": 28,
                        "y": 63
                    },
                    {
                        "x": 28,
                        "y": 67
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 10,
                        "y": 62
                    },
                    {
                        "x": 38,
                        "y": 62
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 38,
                        "y": 60
                    },
                    {
                        "x": 36,
                        "y": 60
                    },
                    {
                        "x": 36,
                        "y": 75
                    },
                    {
                        "x": 34,
                        "y": 75
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 42,
                        "y": 61
                    },
                    {
                        "x": 46,
                        "y": 61
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 50,
                        "y": 61
                    },
                    {
                        "x": 54,
                        "y": 61
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 11,
                        "y": 91
                    },
                    {
                        "x": 14,
                        "y": 91
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 18,
                        "y": 91
                    },
                    {
                        "x": 22,
                        "y": 91
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 26,
                        "y": 91
                    },
                    {
                        "x": 30,
                        "y": 91
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 20,
                        "y": 91
                    },
                    {
                        "x": 20,
                        "y": 96
                    },
                    {
                        "x": 22,
                        "y": 96
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 26,
                        "y": 96
                    },
                    {
                        "x": 30,
                        "y": 96
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 66,
                        "y": 77
                    },
                    {
                        "x": 70,
                        "y": 77
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 58,
                        "y": 61
                    },
                    {
                        "x": 60,
                        "y": 61
                    },
                    {
                        "x": 60,
                        "y": 76
                    },
                    {
                        "x": 62,
                        "y": 76
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 62,
                        "y": 77
                    },
                    {
                        "x": 56,
                        "y": 77
                    },
                    {
                        "x": 56,
                        "y": 91
                    },
                    {
                        "x": 34,
                        "y": 91
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 52,
                        "y": 61
                    },
                    {
                        "x": 52,
                        "y": 90
                    },
                    {
                        "x": 62,
                        "y": 90
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 56,
                        "y": 91
                    },
                    {
                        "x": 62,
                        "y": 91
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 66,
                        "y": 91
                    },
                    {
                        "x": 69,
                        "y": 91
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 11,
                        "y": 29
                    },
                    {
                        "x": 19,
                        "y": 29
                    },
                    {
                        "x": 19,
                        "y": 24
                    },
                    {
                        "x": 21,
                        "y": 24
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 12,
                        "y": 38
                    },
                    {
                        "x": 16,
                        "y": 38
                    },
                    {
                        "x": 17,
                        "y": 38
                    },
                    {
                        "x": 17,
                        "y": 42
                    },
                    {
                        "x": 21,
                        "y": 42
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 12,
                        "y": 42
                    },
                    {
                        "x": 16,
                        "y": 42
                    },
                    {
                        "x": 16,
                        "y": 43
                    },
                    {
                        "x": 21,
                        "y": 43
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 12,
                        "y": 46
                    },
                    {
                        "x": 16,
                        "y": 46
                    },
                    {
                        "x": 16,
                        "y": 45
                    },
                    {
                        "x": 21,
                        "y": 45
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 12,
                        "y": 50
                    },
                    {
                        "x": 17,
                        "y": 50
                    },
                    {
                        "x": 17,
                        "y": 46
                    },
                    {
                        "x": 21,
                        "y": 46
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 18,
                        "y": 104
                    },
                    {
                        "x": 22,
                        "y": 104
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 42,
                        "y": 107
                    },
                    {
                        "x": 46,
                        "y": 107
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 12,
                        "y": 103
                    },
                    {
                        "x": 14,
                        "y": 103
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 10,
                        "y": 111
                    },
                    {
                        "x": 12,
                        "y": 111
                    },
                    {
                        "x": 12,
                        "y": 105
                    },
                    {
                        "x": 14,
                        "y": 105
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 12,
                        "y": 99
                    },
                    {
                        "x": 13,
                        "y": 99
                    },
                    {
                        "x": 13,
                        "y": 102
                    },
                    {
                        "x": 14,
                        "y": 102
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 26,
                        "y": 104
                    },
                    {
                        "x": 29,
                        "y": 104
                    },
                    {
                        "x": 29,
                        "y": 106
                    },
                    {
                        "x": 31,
                        "y": 106
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 26,
                        "y": 108
                    },
                    {
                        "x": 31,
                        "y": 108
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 35,
                        "y": 107
                    },
                    {
                        "x": 38,
                        "y": 107
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 43,
                        "y": 107
                    },
                    {
                        "x": 43,
                        "y": 111
                    },
                    {
                        "x": 21,
                        "y": 111
                    },
                    {
                        "x": 21,
                        "y": 109
                    },
                    {
                        "x": 22,
                        "y": 109
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 34,
                        "y": 116
                    },
                    {
                        "x": 45,
                        "y": 116
                    },
                    {
                        "x": 45,
                        "y": 109
                    },
                    {
                        "x": 46,
                        "y": 109
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 26,
                        "y": 116
                    },
                    {
                        "x": 30,
                        "y": 116
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 10,
                        "y": 107
                    },
                    {
                        "x": 11,
                        "y": 107
                    },
                    {
                        "x": 11,
                        "y": 108
                    },
                    {
                        "x": 20,
                        "y": 108
                    },
                    {
                        "x": 20,
                        "y": 107
                    },
                    {
                        "x": 22,
                        "y": 107
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 14,
                        "y": 106
                    },
                    {
                        "x": 13,
                        "y": 106
                    },
                    {
                        "x": 13,
                        "y": 108
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 20,
                        "y": 108
                    },
                    {
                        "x": 20,
                        "y": 115
                    },
                    {
                        "x": 22,
                        "y": 115
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 12,
                        "y": 111
                    },
                    {
                        "x": 12,
                        "y": 117
                    },
                    {
                        "x": 22,
                        "y": 117
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 37,
                        "y": 10
                    },
                    {
                        "x": 41,
                        "y": 10
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 19,
                        "y": 10
                    },
                    {
                        "x": 23,
                        "y": 10
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 20,
                        "y": 10
                    },
                    {
                        "x": 20,
                        "y": 23
                    },
                    {
                        "x": 21,
                        "y": 23
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 20,
                        "y": 23
                    },
                    {
                        "x": 20,
                        "y": 41
                    },
                    {
                        "x": 21,
                        "y": 41
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 12,
                        "y": 10
                    },
                    {
                        "x": 15,
                        "y": 10
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 49,
                        "y": 16
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 72,
                        "y": 22
                    },
                    {
                        "x": 72,
                        "y": 26
                    },
                    {
                        "x": 73,
                        "y": 26
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 77,
                        "y": 27
                    },
                    {
                        "x": 79,
                        "y": 27
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 65,
                        "y": 28
                    },
                    {
                        "x": 73,
                        "y": 28
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 50,
                        "y": 108
                    },
                    {
                        "x": 51,
                        "y": 108
                    },
                    {
                        "x": 52,
                        "y": 108
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 10,
                        "y": 120
                    },
                    {
                        "x": 31,
                        "y": 120
                    },
                    {
                        "x": 31,
                        "y": 121
                    },
                    {
                        "x": 36,
                        "y": 121
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 11,
                        "y": 120
                    },
                    {
                        "x": 11,
                        "y": 125
                    },
                    {
                        "x": 14,
                        "y": 125
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 18,
                        "y": 124
                    },
                    {
                        "x": 21,
                        "y": 124
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 14,
                        "y": 123
                    },
                    {
                        "x": 13,
                        "y": 123
                    },
                    {
                        "x": 13,
                        "y": 121
                    },
                    {
                        "x": 26,
                        "y": 121
                    },
                    {
                        "x": 26,
                        "y": 130
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 11,
                        "y": 127
                    },
                    {
                        "x": 20,
                        "y": 127
                    },
                    {
                        "x": 20,
                        "y": 126
                    },
                    {
                        "x": 21,
                        "y": 126
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 11,
                        "y": 131
                    },
                    {
                        "x": 29,
                        "y": 131
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 12,
                        "y": 135
                    },
                    {
                        "x": 23,
                        "y": 135
                    },
                    {
                        "x": 23,
                        "y": 132
                    },
                    {
                        "x": 29,
                        "y": 132
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 11,
                        "y": 139
                    },
                    {
                        "x": 25,
                        "y": 139
                    },
                    {
                        "x": 25,
                        "y": 133
                    },
                    {
                        "x": 29,
                        "y": 133
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 12,
                        "y": 143
                    },
                    {
                        "x": 27,
                        "y": 143
                    },
                    {
                        "x": 27,
                        "y": 134
                    },
                    {
                        "x": 29,
                        "y": 134
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 33,
                        "y": 132
                    },
                    {
                        "x": 34,
                        "y": 132
                    },
                    {
                        "x": 34,
                        "y": 119
                    },
                    {
                        "x": 36,
                        "y": 119
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 26,
                        "y": 130
                    },
                    {
                        "x": 29,
                        "y": 130
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 24,
                        "y": 125
                    },
                    {
                        "x": 26,
                        "y": 125
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 40,
                        "y": 120
                    },
                    {
                        "x": 43,
                        "y": 120
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 47,
                        "y": 120
                    },
                    {
                        "x": 50,
                        "y": 120
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 62,
                        "y": 78
                    },
                    {
                        "x": 60,
                        "y": 78
                    },
                    {
                        "x": 60,
                        "y": 92
                    },
                    {
                        "x": 60,
                        "y": 92
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 60,
                        "y": 92
                    },
                    {
                        "x": 60,
                        "y": 120
                    },
                    {
                        "x": 54,
                        "y": 120
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 62,
                        "y": 92
                    },
                    {
                        "x": 62,
                        "y": 119
                    },
                    {
                        "x": 62,
                        "y": 123
                    },
                    {
                        "x": 48,
                        "y": 123
                    },
                    {
                        "x": 48,
                        "y": 120
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 12,
                        "y": 54
                    },
                    {
                        "x": 18,
                        "y": 54
                    },
                    {
                        "x": 18,
                        "y": 47
                    },
                    {
                        "x": 21,
                        "y": 47
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 45,
                        "y": 131
                    },
                    {
                        "x": 46,
                        "y": 131
                    },
                    {
                        "x": 46,
                        "y": 134
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 45,
                        "y": 134
                    },
                    {
                        "x": 45,
                        "y": 135
                    },
                    {
                        "x": 46,
                        "y": 135
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 46,
                        "y": 137
                    },
                    {
                        "x": 45,
                        "y": 137
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 45,
                        "y": 140
                    },
                    {
                        "x": 46,
                        "y": 140
                    },
                    {
                        "x": 46,
                        "y": 138
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 50,
                        "y": 136
                    },
                    {
                        "x": 55,
                        "y": 136
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 54,
                        "y": 137
                    },
                    {
                        "x": 54,
                        "y": 137
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 62,
                        "y": 137
                    },
                    {
                        "x": 62,
                        "y": 137
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 44,
                        "y": 127
                    },
                    {
                        "x": 50,
                        "y": 127
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 68,
                        "y": 126
                    },
                    {
                        "x": 69,
                        "y": 126
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 62,
                        "y": 135
                    },
                    {
                        "x": 62,
                        "y": 137
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 69,
                        "y": 126
                    },
                    {
                        "x": 69,
                        "y": 128
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 69,
                        "y": 129
                    },
                    {
                        "x": 64,
                        "y": 129
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 66,
                        "y": 134
                    },
                    {
                        "x": 69,
                        "y": 134
                    },
                    {
                        "x": 69,
                        "y": 130
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 73,
                        "y": 129
                    },
                    {
                        "x": 74,
                        "y": 129
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 78,
                        "y": 129
                    },
                    {
                        "x": 80,
                        "y": 129
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 78,
                        "y": 129
                    },
                    {
                        "x": 78,
                        "y": 124
                    },
                    {
                        "x": 80,
                        "y": 124
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 17,
                        "y": 44
                    },
                    {
                        "x": 21,
                        "y": 44
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 62,
                        "y": 126
                    },
                    {
                        "x": 63,
                        "y": 126
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 12,
                        "y": 17
                    },
                    {
                        "x": 14,
                        "y": 17
                    },
                    {
                        "x": 14,
                        "y": 20
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 14,
                        "y": 21
                    },
                    {
                        "x": 12,
                        "y": 21
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 12,
                        "y": 25
                    },
                    {
                        "x": 14,
                        "y": 25
                    },
                    {
                        "x": 14,
                        "y": 22
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 18,
                        "y": 21
                    },
                    {
                        "x": 19,
                        "y": 21
                    },
                    {
                        "x": 19,
                        "y": 22
                    },
                    {
                        "x": 21,
                        "y": 22
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 19,
                        "y": 21
                    },
                    {
                        "x": 19,
                        "y": 19
                    },
                    {
                        "x": 22,
                        "y": 19
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 59,
                        "y": 18
                    },
                    {
                        "x": 59,
                        "y": 18
                    },
                    {
                        "x": 59,
                        "y": 31
                    },
                    {
                        "x": 66,
                        "y": 31
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 52,
                        "y": 141
                    },
                    {
                        "x": 52,
                        "y": 137
                    },
                    {
                        "x": 55,
                        "y": 137
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 55,
                        "y": 138
                    },
                    {
                        "x": 55,
                        "y": 144
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 59,
                        "y": 137
                    },
                    {
                        "x": 62,
                        "y": 137
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 54,
                        "y": 127
                    },
                    {
                        "x": 54,
                        "y": 133
                    },
                    {
                        "x": 62,
                        "y": 133
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 36,
                        "y": 91
                    },
                    {
                        "x": 36,
                        "y": 89
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 36,
                        "y": 87
                    },
                    {
                        "x": 36,
                        "y": 85
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 40,
                        "y": 88
                    },
                    {
                        "x": 42,
                        "y": 88
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 73,
                        "y": 116
                    },
                    {
                        "x": 77,
                        "y": 116
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 81,
                        "y": 116
                    },
                    {
                        "x": 86,
                        "y": 116
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 32,
                        "y": 101
                    },
                    {
                        "x": 32,
                        "y": 101
                    },
                    {
                        "x": 32,
                        "y": 101
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 71,
                        "y": 103
                    },
                    {
                        "x": 77,
                        "y": 103
                    },
                    {
                        "x": 77,
                        "y": 106
                    },
                    {
                        "x": 79,
                        "y": 106
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 71,
                        "y": 107
                    },
                    {
                        "x": 79,
                        "y": 107
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 79,
                        "y": 109
                    },
                    {
                        "x": 71,
                        "y": 109
                    },
                    {
                        "x": 71,
                        "y": 111
                    },
                    {
                        "x": 70,
                        "y": 111
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 77,
                        "y": 113
                    },
                    {
                        "x": 78,
                        "y": 113
                    },
                    {
                        "x": 78,
                        "y": 110
                    },
                    {
                        "x": 79,
                        "y": 110
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 83,
                        "y": 108
                    },
                    {
                        "x": 85,
                        "y": 108
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 62,
                        "y": 125
                    },
                    {
                        "x": 62,
                        "y": 126
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 70,
                        "y": 99
                    },
                    {
                        "x": 74,
                        "y": 99
                    },
                    {
                        "x": 74,
                        "y": 108
                    },
                    {
                        "x": 79,
                        "y": 108
                    }
                ]
            },
            {
                "type1": "LinkLine",
                "points": [
                    {
                        "x": 33,
                        "y": 10
                    },
                    {
                        "x": 33,
                        "y": 7
                    },
                    {
                        "x": 20,
                        "y": 7
                    },
                    {
                        "x": 20,
                        "y": 10
                    }
                ]
            }
        ];
        $.loadGrpData(data);
    })

    var desStr = `PRS-713型微机线路保护装置,110
81,0A,81D
5,104-保护启动           ,,,0
6,105-纵联差动保护硬压板 ,,,0
7,106-光纤通道一硬压板   ,,,0
8,107-光纤通道二硬压板   ,,,0
9,108-距离保护硬压板     ,,,0
10,109-零序过流保护硬压板 ,,,0
11,110-远方操作硬压板     ,,,0
12,111-保护检修状态硬压板 ,,,0
13,112-远传1              ,,,0
14,113-远传2              ,,,0
15,114-其它保护动作       ,,,0
16,115-后备跳闸           ,,,0
17,116-后备重合启动       ,,,0
18,117-后备合闸           ,,,0
19,118-握手信号4          ,,,0
20,119-光纤收远传1        ,,,0
21,120-光纤收远传2        ,,,0
22,121-光纤收其它保护动作 ,,,0
23,122-本侧启动           ,,,0
24,123-对侧启动           ,,,0
25,124-对侧三跳位置       ,,,0
26,125-选出A相            ,,,0
27,126-选出B相            ,,,0
28,127-选出C相            ,,,0
29,128-分相差动A相动作    ,,,0
30,129-分相差动B相动作    ,,,0
31,130-分相差动C相动作    ,,,0
32,131-零序差动动作       ,,,0
33,132-闭锁重合闸         ,,,0
34,133-PT断线             ,,,0
35,134-A相CT断线          ,,,0
36,135-B相CT断线          ,,,0
37,136-C相CT断线          ,,,0
38,137-远方其他保护动作   ,,,0
39,138-测距动作           ,,,0
40,139-开入异常           ,,,0
41,140-电压辅助启动       ,,,0
42,141-重合闸启动         ,,,0
43,142-远跳收信启动       ,,,0
44,143-差电流闭锁复归     ,,,0
45,144-重合闸启动闭锁复归 ,,,0
46,145-远跳收信闭锁复归   ,,,0
47,146-电流突变量启动     ,,,0
48,147-零序电流启动       ,,,0
49,148-本侧差动投入标志   ,,,0
50,149-对侧差动投入标志   ,,,0
51,150-本侧差动允许标志   ,,,0
52,151-对侧差动允许标志   ,,,0
53,152-本侧A相CT断线      ,,,0
54,153-本侧B相CT断线      ,,,0
55,154-本侧C相CT断线      ,,,0
56,155-对侧A相CT断线      ,,,0
57,156-对侧B相CT断线      ,,,0
58,157-对侧C相CT断线      ,,,0
59,158-本侧A相CT饱和      ,,,0
60,159-本侧B相CT饱和      ,,,0
61,160-本侧C相CT饱和      ,,,0
62,161-对侧A相CT饱和      ,,,0
63,162-对侧B相CT饱和      ,,,0
64,163-对侧C相CT饱和      ,,,0
65,164-本侧后加速标志     ,,,0
66,165-对侧后加速标志     ,,,0
67,166-本侧非全相标志     ,,,0
68,167-A相采样值差流开放  ,,,0
69,168-B相采样值差流开放  ,,,0
70,169-C相采样值差流开放  ,,,0
71,170-A相采样值差动      ,,,0
72,171-B相采样值差动      ,,,0
73,172-C相采样值差动      ,,,0
74,173-A相突变量比差启动  ,,,0
75,174-B相突变量比差启动  ,,,0
76,175-C相突变量比差启动  ,,,0
77,176-A相稳态比差启动    ,,,0
78,177-B相稳态比差启动    ,,,0
79,178-C相稳态比差启动    ,,,0
80,179-零序比差启动       ,,,0
81,180-A相差流波形开放    ,,,0
82,181-B相差流波形开放    ,,,0
83,182-C相差流波形开放    ,,,0
84,183-零序差流波形开放   ,,,0
85,184-定值参数软压板自检 ,,,0
50
1
1000,605
23/11/2018,18:27:14.652000
23/11/2018,18:27:14.692000
ASCII
1.00
    `
    desStr = desStr.split('\n');
    var desCount = desStr[1].split(',');
    desCount = parseInt(desCount[0]);
    var desResultData = desStr.slice(2, 2 + desCount);
    desResultData = desResultData.map(function (data) {
        var dataArr = data.split(',');
        return {
            id: dataArr[0],
            name: dataArr[1].replace(/\s*$/, ''),
            type: dataArr[2],
            percentage: dataArr[3],
            isShow: dataArr[4]
        }
    });

    var midStr = `1,-40000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
2,-39000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
3,-38000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
4,-37000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
5,-36000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
6,-35000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
7,-34000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
8,-33000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
9,-32000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
10,-31000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
11,-30000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
12,-29000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
13,-28000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
14,-27000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
15,-26000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
16,-25000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
17,-24000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
18,-23000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
19,-22000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
20,-21000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
21,-20000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
22,-19000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
23,-18000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
24,-17000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
25,-16000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
26,-15000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
27,-14000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
28,-13000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
29,-12000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
30,-11000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
31,-10000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
32,-9000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
33,-8000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
34,-7000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
35,-6000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
36,-5000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
37,-4000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
38,-3000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
39,-2000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
40,-1000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
41,0,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
42,1000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
43,2000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
44,3000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
45,4000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
46,5000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
47,6000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
48,7000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
49,8000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
50,9000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
51,10000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
52,11000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
53,12000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
54,13000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
55,14000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
56,15000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
57,16000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
58,17000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
59,18000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
60,19000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
61,20000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
62,21000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
63,22000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
64,23000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
65,24000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
66,25000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
67,26000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
68,27000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
69,28000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
70,29000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
71,30000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
72,31000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
73,32000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
74,33000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
75,34000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
76,35000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
77,36000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
78,37000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
79,38000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
80,39000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
81,40000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
82,41000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
83,42000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
84,43000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
85,44000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
86,45000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
87,46000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
88,47000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
89,48000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
90,49000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
91,50000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
92,51000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
93,52000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
94,53000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
95,54000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
96,55000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
97,56000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
98,57000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
99,58000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
100,59000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
101,60000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
102,61000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
103,62000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
104,63000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
105,64000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
106,65000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
107,66000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
108,67000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
109,68000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
110,69000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
111,70000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
112,71000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
113,72000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
114,73000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
115,74000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
116,75000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
117,76000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
118,77000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
119,78000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
120,79000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
121,80000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
122,81000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
123,82000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
124,83000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
125,84000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
126,85000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
127,86000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
128,87000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
129,88000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
130,89000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
131,90000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
132,91000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
133,92000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
134,93000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
135,94000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
136,95000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
137,96000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
138,97000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
139,98000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
140,99000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
141,100000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
142,101000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
143,102000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
144,103000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
145,104000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
146,105000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
147,106000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
148,107000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
149,108000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
150,109000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
151,110000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
152,111000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
153,112000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
154,113000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
155,114000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
156,115000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
157,116000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
158,117000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
159,118000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
160,119000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
161,120000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
162,121000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
163,122000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
164,123000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
165,124000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
166,125000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
167,126000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
168,127000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
169,128000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
170,129000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
171,130000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
172,131000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
173,132000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
174,133000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
175,134000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
176,135000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
177,136000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
178,137000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
179,138000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
180,139000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
181,140000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
182,141000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
183,142000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
184,143000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
185,144000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
186,145000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
187,146000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
188,147000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
189,148000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
190,149000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
191,150000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
192,151000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
193,152000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
194,153000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
195,154000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
196,155000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
197,156000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
198,157000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
199,158000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
200,159000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
201,160000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
202,161000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
203,162000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
204,163000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
205,164000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
206,165000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
207,166000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
208,167000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
209,168000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
210,169000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
211,170000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
212,171000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
213,172000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
214,173000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
215,174000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
216,175000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
217,176000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
218,177000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
219,178000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
220,179000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
221,180000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
222,181000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
223,182000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
224,183000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
225,184000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
226,185000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
227,186000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
228,187000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
229,188000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
230,189000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
231,190000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
232,191000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
233,192000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
234,193000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
235,194000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
236,195000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
237,196000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
238,197000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
239,198000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
240,199000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
241,239000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
242,279000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
243,319000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
244,359000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
245,399000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
246,439000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
247,479000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
248,519000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
249,559000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
250,599000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
251,639000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
252,679000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
253,719000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
254,759000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
255,799000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
256,839000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
257,879000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
258,919000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
259,959000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
260,999000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
261,1039000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
262,1079000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
263,1119000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
264,1159000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
265,1199000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
266,1239000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
267,1279000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
268,1319000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
269,1359000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
270,1399000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
271,1439000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
272,1479000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
273,1519000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
274,1559000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
275,1599000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
276,1639000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
277,1679000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
278,1719000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
279,1759000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
280,1799000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
281,1839000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
282,1879000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
283,1919000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
284,1959000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
285,1999000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
286,2039000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
287,2079000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
288,2119000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
289,2159000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
290,2199000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
291,2239000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
292,2279000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
293,2319000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
294,2359000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
295,2399000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
296,2439000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
297,2479000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
298,2519000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
299,2559000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
300,2599000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
301,2639000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
302,2679000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
303,2719000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
304,2759000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
305,2799000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
306,2839000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
307,2879000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
308,2919000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
309,2959000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
310,2999000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
311,3039000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
312,3079000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
313,3119000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
314,3159000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
315,3199000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
316,3239000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
317,3279000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
318,3319000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
319,3359000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
320,3399000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
321,3439000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
322,3479000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
323,3519000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
324,3559000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
325,3599000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
326,3639000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
327,3679000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
328,3719000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
329,3759000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
330,3799000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
331,3839000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
332,3879000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
333,3919000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
334,3959000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
335,3999000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
336,4039000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
337,4079000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
338,4119000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
339,4159000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
340,4199000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
341,4239000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
342,4279000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
343,4319000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
344,4359000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
345,4399000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
346,4439000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
347,4479000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
348,4519000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
349,4559000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
350,4599000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
351,4639000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
352,4679000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
353,4719000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
354,4759000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
355,4799000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
356,4839000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
357,4879000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
358,4919000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
359,4959000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
360,4999000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
361,5039000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
362,5079000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
363,5119000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
364,5159000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
365,5199000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
366,5239000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
367,5279000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
368,5319000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
369,5359000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
370,5399000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
371,5439000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
372,5479000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
373,5519000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
374,5559000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
375,5599000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
376,5639000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
377,5679000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
378,5719000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
379,5759000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
380,5799000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
381,5839000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
382,5879000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
383,5919000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
384,5959000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
385,5999000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
386,6039000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
387,6079000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
388,6119000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
389,6159000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
390,6199000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
391,6239000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
392,6279000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
393,6319000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
394,6359000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
395,6399000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
396,6439000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
397,6479000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
398,6519000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
399,6559000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
400,6599000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
401,6639000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
402,6679000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
403,6719000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
404,6759000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
405,6799000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
406,6950000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
407,6951000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
408,6952000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
409,6953000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
410,6954000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
411,6955000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
412,6956000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
413,6957000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
414,6958000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
415,6959000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
416,6960000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
417,6961000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
418,6962000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
419,6963000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
420,6964000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
421,6965000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
422,6966000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
423,6967000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
424,6968000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
425,6969000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
426,6970000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
427,6971000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
428,6972000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
429,6973000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
430,6974000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
431,6975000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
432,6976000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
433,6977000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
434,6978000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
435,6979000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
436,6980000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
437,6981000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
438,6982000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
439,6983000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
440,6984000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
441,6985000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
442,6986000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
443,6987000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
444,6988000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
445,6989000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
446,6990000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
447,6991000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
448,6992000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
449,6993000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
450,6994000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
451,6995000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
452,6996000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
453,6997000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
454,6998000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
455,6999000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
456,7000000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
457,7001000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
458,7002000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
459,7003000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
460,7004000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
461,7005000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
462,7006000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
463,7007000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
464,7008000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
465,7009000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
466,7010000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
467,7011000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
468,7012000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
469,7013000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
470,7014000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
471,7015000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
472,7016000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
473,7017000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
474,7018000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
475,7019000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
476,7020000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
477,7021000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
478,7022000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
479,7023000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
480,7024000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
481,7025000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
482,7026000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
483,7027000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
484,7028000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
485,7029000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
486,7030000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
487,7031000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
488,7032000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
489,7033000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
490,7034000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
491,7035000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
492,7036000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
493,7037000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
494,7038000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
495,7039000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
496,7040000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
497,7041000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
498,7042000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
499,7043000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
500,7044000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
501,7045000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
502,7046000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
503,7047000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
504,7048000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
505,7049000,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
506,7050000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
507,7051000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
508,7052000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
509,7053000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
510,7054000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
511,7055000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
512,7056000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
513,7057000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
514,7058000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
515,7059000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
516,7060000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
517,7061000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
518,7062000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
519,7063000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
520,7064000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
521,7065000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
522,7066000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
523,7067000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
524,7068000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
525,7069000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
526,7070000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
527,7071000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
528,7072000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
529,7073000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
530,7074000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
531,7075000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
532,7076000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
533,7077000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
534,7078000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
535,7079000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
536,7080000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
537,7081000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
538,7082000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
539,7083000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
540,7084000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
541,7085000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
542,7086000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
543,7087000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
544,7088000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
545,7089000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
546,7090000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
547,7091000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
548,7092000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
549,7093000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
550,7094000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
551,7095000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
552,7096000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
553,7097000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
554,7098000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
555,7099000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
556,7100000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
557,7101000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
558,7102000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
559,7103000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
560,7104000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
561,7105000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
562,7106000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
563,7107000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
564,7108000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
565,7109000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
566,7110000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
567,7111000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
568,7112000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
569,7113000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
570,7114000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
571,7115000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
572,7116000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
573,7117000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
574,7118000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
575,7119000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
576,7120000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
577,7121000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
578,7122000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
579,7123000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
580,7124000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
581,7125000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
582,7126000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
583,7127000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
584,7128000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
585,7129000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
586,7130000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
587,7131000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
588,7132000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
589,7133000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
590,7134000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
591,7135000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
592,7136000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
593,7137000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
594,7138000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
595,7139000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
596,7140000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
597,7141000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
598,7142000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
599,7143000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
600,7144000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
601,7145000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
602,7146000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
603,7147000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
604,7148000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
605,7149000,0,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
    `;
    var midData = midStr.split('\n');
    midData = midData.map(function (item) {
        return item.split(',');
    })
    console.log('midData:', midData);
})