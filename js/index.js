$(function () {
    var box = new twaver.ElementBox();
    var network = new twaver.vector.SpniceNetwork(box);
    box.setStyle('background.type', 'vector');
    box.setStyle('background.vector.fill', true);
    box.setStyle('background.vector.fill.color', '#FFFFE1');

    // 左边通道数据列表
    var channelFrame = document.createElement('div');
    channelFrame.style.width = '100%';
    channelFrame.style.overflowX = 'scroll';
    channelFrame.style.overflowY = 'auto';
    channelFrame.style.backgroundColor = 'black';

    var channelSelectionBtn = document.createElement('button');
    channelSelectionBtn.innerText = '选择通道';
    channelSelectionBtn.style.position = 'absolute';
    channelSelectionBtn.style.left = '10px';
    channelSelectionBtn.style.top = '10px';
    channelSelectionBtn.setAttribute('class', 'btn btn-primary');
    channelSelectionBtn.addEventListener('click', function () {
        $('#channelDialog').modal('toggle');
    });

    // 右边通道的波形图
    var chartFrame = document.createElement('div');
    chartFrame.style.width = '100%';
    chartFrame.style.height = '100%';
    chartFrame.style.overflowX = 'scroll';
    chartFrame.style.overflowY = 'auto';
    chartFrame.style.backgroundColor = 'black';
    window.chartFrame = chartFrame;

    var optTimeout, contTimeout;

    /**
     * 同步channelFrame和chartFrame的y轴滚动
     */
    $(channelFrame).on('scroll', function () {
        if(contTimeout) return;
        if(optTimeout) clearTimeout(optTimeout);
        optTimeout = setTimeout(function () {
            if(optTimeout) {
                clearTimeout(optTimeout);
                optTimeout = null;
            }
        }, 50);

        $(chartFrame)[0].scrollTop = this.scrollTop;
    });

    $(chartFrame).on('scroll', function () {
        if(optTimeout) return;
        if(contTimeout) clearTimeout(contTimeout);
        contTimeout = setTimeout(function() {
            if(contTimeout) {
                clearTimeout(contTimeout);
                contTimeout = null;
            }
        }, 50);

        $(channelFrame)[0].scrollTop = this.scrollTop;
    });

    /**
     * 布局代码
     */
    var leftTopSplitPane = new twaver.controls.SplitPane(channelFrame, chartFrame, 'horizontal', 0.2);
    var leftSplitPane = new twaver.controls.SplitPane(leftTopSplitPane, network.getView(), 'vertical', 0.2);
    var rightEventListPane = $.initTable();

    var mainSplitPane = new twaver.controls.SplitPane(leftSplitPane, rightEventListPane, 'horizontal', 0.8);
    var mainSplitPaneView = mainSplitPane.getView();

    var mainDiv = document.getElementById('main');
    mainDiv.appendChild(mainSplitPaneView);
    mainSplitPaneView.style.position = 'absolute';
    mainSplitPaneView.style.top = '0';
    mainSplitPaneView.style.right = '0';
    mainSplitPaneView.style.bottom = '0';
    mainSplitPaneView.style.left = '0';

    network.adjustBounds({
        x: 0,
        y: 0,
        width: document.body.clientWidth * 0.8,
        height: document.body.clientHeight * 0.8
    });

    mainSplitPane.addPropertyChangeListener(function (data) {
        if (data.property === 'position') {

        }
    });
    window.addEventListener('resize', function () {
        mainSplitPane.invalidate();

        network.adjustBounds({
            x: 0,
            y: 0,
            width: document.body.clientWidth * 0.8,
            height: document.body.clientHeight * 0.8
        });
    });

    /**
     * 模态框确定按钮点击事件
     */
    $('#highChartDisplayBtn').on('click', function () {
        $('#channelDialog').modal('hide');

        // 获取选中的通道
        var tmpChartData = [];
        $("#channelTransferEffect .transfer-list-right ul.ty-tree-select li").each(function(i, element) {
            tmpChartData.push(window.cfgResultData[parseInt($(element).attr('data-index'))])
        })

        $.loadChartData(tmpChartData);
    });

    /**
     * 显示模拟量通道
     */
    $("#analogChannelBtn").on('click', function () {
        $.reloadTransferEffectData(window.cfgResultData.filter(function (dataItem) {
            return dataItem.isAnalog;
        }))
    });

    /**
     * 显示开关量通道
     */
    $("#switchChannelBtn").on('click', function () {
        $.reloadTransferEffectData(window.cfgResultData.filter(function (dataItem) {
            return !dataItem.isAnalog;
        }))
    });

    /**
     * 通过选择的通道重新加载选择框内的数据
     * @param data 数据数组
     */
    $.reloadTransferEffectData = function(data) {
        var channelUl = $('#channelTransferEffect .transfer-list-left ul.ty-tree-select');
        var selectedChannelUl = $('#channelTransferEffect .transfer-list-right ul.ty-tree-select');
        channelUl.empty();
        selectedChannelUl.empty();
        data.map(function (dataItem, dataIdx) {
            var channelLiItem = $('<li></li>').attr('data-index', dataIdx);
            channelLiItem.html('<div class="ty-tree-div">' +
                '                                <label class="tyue-checkbox-wrapper">' +
                '                                    <span class="tyue-checkbox">' +
                '                                        <input type="checkbox" class="tyue-checkbox-input">' +
                '                                        <span class="tyue-checkbox-circle"></span>' +
                '                                    </span>' +
                '                                    <span class="tyue-checkbox-txt" title="' + dataItem.name + '">' + dataItem.name +
                '                                    </span>' +
                '                                </label>' +
                '                            </div>');
            channelUl.append(channelLiItem);
        });

        $("#channelTransferEffect").transferItem();
    };

    /**
     * 加载cfg和data文件内容
     * @param data
     */
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
            var element = new twaver[type]();
            $.isNumeric(info.x) && $.isNumeric(info.y) && element.setLocation(info.x, info.y);
            $.isNumeric(info.width) && element.setWidth(info.width);
            $.isNumeric(info.height) && element.setHeight(info.height);
            info.InputArray && element.setClient('inputs', info.InputArray);
            $.isNumeric(info.id) && element.setClient('id', info.id);
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
                            id: element.getClient('id'),
                            y: point.y
                        }));
                    } else {
                        inputs.push(JSON.stringify({
                            id: element.getClient('id'),
                            y: point.y
                        }));
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
                /**
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
                 **/
                relation.lines.forEach(function (element) {
                    element.setClient('lineInput', JSON.parse(relation.inputs[0]).id);
                });
            }
        });

        /**
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
         **/

        network.startZoomOverView();

        var elementsIdArr = [0, 1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 32];

        /**
        setInterval(function(){
            var statesArr = [];
            for(var i = 0; i < elementsIdArr.length; i++) {
                statesArr.push(Math.random() >= 0.5);
            }
            network.resetSetState();
            network.setStates(elementsIdArr, statesArr);
        }, 1000);
         **/
    }

    /**
     * 加载
     * @type {{"module.exports": *[]}}
     */
    $.loadChartData = function (cfgResultDataArr) {
        var chartArr = [];
        var valueLabelArr = [];

        $(channelFrame).empty();
        $(chartFrame).empty();
        channelFrame.appendChild(channelSelectionBtn);

        cfgResultDataArr.map(function (cfgResultData, cfgIdx) {
            var yData = cfgResultData.data;

            var channelDiv = document.createElement('div');
            channelDiv.style.height = '80px';
            channelDiv.style.margin = i === 2 ? '60px 10px 0 10px': '95px 10px 0 10px';
            channelDiv.style.padding = '10px';
            channelDiv.style.backgroundColor = '#C0C1CF';
            channelDiv.style.borderRadius = '5px';
            channelFrame.appendChild(channelDiv);

            var chartDiv = document.createElement('div');
            chartDiv.style.width = 5*midData[midData.length-1][1] / 1000 +'px';
            chartDiv.style.height = '200px';
            chartDiv.style.position = 'relative';
            if (i !== 2) {
                chartDiv.style.marginTop = '-24px'
            }
            chartFrame.appendChild(chartDiv);
            var lineColor = 'red';
            switch (cfgIdx % 3) {
                case 0:
                    lineColor = 'green';
                    break;
                case 1:
                    lineColor = 'blue';
                    break;
                case 2:
                    lineColor = 'red';
                    break;
                default:
                    lineColor = 'red';
                    break;
            }

            var chartItem = Highcharts.chart({
                title: {
                    text: ''
                },
                tooltip: {
                    enabled: false
                },
                legend: {
                    enabled: false
                },
                subtitle: {
                    text: ''
                },
                xAxis: {
                    lineWidth: 0,
                    tickWidth: 0,
                    labels: {
                        enabled: false
                    },
                    plotLines:[{
                        color:'red',
                        dashStyle:'ShortDash',
                        value: 0,
                        width: 2,
                        id: 'red'
                    }]
                },
                yAxis: {
                    tickWidth: 0,
                    gridLineWidth: 0,
                    labels: {
                        enabled: false
                    },
                    title: false
                },
                plotOptions: {
                    series: {
                        label: {
                            connectorAllowed: false,
                            style: {
                                color: 'red'
                            }
                        },
                        color: lineColor,
                        animation: false,
                        cursor: 'pointer',
                        events: {
                            // 点击数据点，重新绘制y轴的标识线
                            click: function(e) {
                                var xValue = e.point.x;
                                var xValueArr = yData.map(function (yDataItem) {
                                    return yDataItem[0];
                                });
                                var minOffset, minX;
                                xValueArr.map(function (xValueItem) {
                                    var currentOffset = Math.abs(xValueItem - xValue);
                                    if (typeof minOffset === 'undefined' && typeof minX === 'undefined') {
                                        minOffset = currentOffset
                                        minX = xValueItem;
                                    } else if (currentOffset < minOffset) {
                                        minOffset = currentOffset;
                                        minX = xValueItem;
                                    }
                                });

                                chartArr.map(function (item, index) {
                                    item.xAxis[0].removePlotLine('green');

                                    item.xAxis[0].addPlotLine({
                                        width: 2,
                                        color: 'green',
                                        dashStyle: 'ShortDash',
                                        id: 'green',
                                        value: minX
                                    })
                                });
                            }
                        }
                    }
                },
                series: [{
                    name: '',
                    data: yData,
                    lineWidth: 1
                }],
                chart : {
                    type: 'line',
                    backgroundColor: 'rgba(0, 0, 0, 0)',
                    renderTo : chartDiv,
                    marginLeft: -300,
                    events: {
                        // 点击坐标轴，重新绘制y轴的标识线
                        click: function (e) {
                            var xValue = e.xAxis[0].value;
                            var xValueArr = yData.map(function (yDataItem) {
                                return yDataItem[0];
                            });
                            var minOffset, minX;
                            xValueArr.map(function (xValueItem) {
                                var currentOffset = Math.abs(xValueItem - xValue);
                                if (typeof minOffset === 'undefined' && typeof minX === 'undefined') {
                                    minOffset = currentOffset
                                    minX = xValueItem;
                                } else if (currentOffset < minOffset) {
                                    minOffset = currentOffset;
                                    minX = xValueItem;
                                }
                            });

                            chartArr.map(function (item, index) {
                                item.xAxis[0].removePlotLine('green');

                                item.xAxis[0].addPlotLine({
                                    width: 2,
                                    color: 'green',
                                    dashStyle: 'ShortDash',
                                    id: 'green',
                                    value: minX
                                })
                            });
                        }
                    }
                }
            });

            var titleLabel = document.createElement('div');
            titleLabel.innerHTML = cfgResultData.name;
            titleLabel.style.color = 'white';
            titleLabel.style.background = lineColor;
            titleLabel.style.padding = '4px 4px 4px 8px';
            titleLabel.style.borderRadius = '4px';
            channelDiv.appendChild(titleLabel);

            var valueLabel = document.createElement('div');
            valueLabel.style.marginTop = '10px';
            valueLabel.style.fontSize = '15px';
            valueLabelArr.push(valueLabel);
            channelDiv.appendChild(valueLabel);

            (function(chartItem, chartArr, chartDiv, waveDataGroup, waveDataCount) {
                $(chartDiv).on('mousemove', function(e) {
                    var xaxis = chartItem.xAxis[0];
                    var xValue = xaxis.toValue(e.offsetX, false);
                    chartArr.map(function (item) {
                        item.xAxis[0].removePlotLine('red');
                    });

                    var xValueArr = yData.map(function (yDataItem) {
                        return yDataItem[0];
                    });
                    var minOffset, minX, minXIndex;
                    xValueArr.map(function (xValueItem, xIndex) {
                        var currentOffset = Math.abs(xValueItem - xValue);
                        if (typeof minOffset === 'undefined' && typeof minX === 'undefined') {
                            minOffset = currentOffset
                            minX = xValueItem;
                            minXIndex = xIndex;
                        } else if (currentOffset < minOffset) {
                            minOffset = currentOffset;
                            minX = xValueItem;
                            minXIndex = xIndex;
                        }
                    });

                    var intervalMinIndex, intervalMaxIndex, perCycleSampPtNum, useFormula;
                    waveDataGroup.map(function (groupItem) {
                        if (minXIndex >= groupItem.min && minXIndex <= groupItem.max) {
                            useFormula = groupItem.frequency / waveDataCount >= 4;
                            if (useFormula) {
                                if (minXIndex + groupItem.frequency / waveDataCount > groupItem.max) {
                                    intervalMaxIndex = groupItem.max;
                                    intervalMinIndex = intervalMaxIndex - groupItem.frequency / waveDataCount + 1;
                                } else {
                                    intervalMinIndex = minXIndex;
                                    intervalMaxIndex = intervalMinIndex + groupItem.frequency / waveDataCount - 1;
                                }
                                perCycleSampPtNum = groupItem.frequency / waveDataCount;
                            }

                            return false;
                        }
                    });

                    chartArr.map(function (item, index) {
                        item.xAxis[0].removePlotLine('red');

                        item.xAxis[0].addPlotLine({
                            width: 2,
                            color: 'red',
                            dashStyle: 'ShortDash',
                            id: 'red',
                            value: minX
                        })

                        // 获取瞬时值
                        var valueLabel = valueLabelArr[index];
                        var currentData = item.series[0].data.filter(function (dataItem) {
                            return dataItem.x === minX;
                        });
                        currentData = currentData[0].y;

                        // 获取有效值
                        var validValue;

                        var isAnalog = cfgResultData.isAnalog;
                        if (isAnalog) {
                            // 模拟量
                            if (useFormula) {
                                var cosAmp = 0, sinAmp = 0, harmTime = 1;
                                var intervalData = item.series[0].data.slice(intervalMinIndex, intervalMaxIndex + 1).map(function (item) {
                                    return item.y;
                                });

                                intervalData.map(function (intervalDataItem, intervalDataIdx) {
                                    cosAmp += intervalDataItem * Math.cos(2 * Math.PI * harmTime * (intervalDataIdx + 1) / perCycleSampPtNum);
                                    sinAmp += intervalDataItem * Math.sin(2 * Math.PI * harmTime * (intervalDataIdx + 1) / perCycleSampPtNum);
                                });

                                cosAmp = 2 * cosAmp / perCycleSampPtNum;
                                sinAmp = 2 * sinAmp / perCycleSampPtNum;

                                validValue = Math.sqrt(cosAmp * cosAmp + sinAmp * sinAmp);
                                validValue = validValue / 1.41421;
                                validValue = validValue.toFixed(3);
                            } else {
                                validValue = currentData / Math.sqrt(2);
                                validValue = validValue.toFixed(3);
                            }

                            currentData = currentData.toFixed(3);
                        } else {
                            // 开关量
                            validValue = currentData;
                        }

                        if (currentData.length !== 0) {
                            valueLabel.innerHTML = '<div style="color: green; float: left">瞬时值：' + currentData + '</div>' +
                                '<div style="color: red; float: right">有效值：' + validValue  + '</div><div style="clear: both;"></div>';
                        }
                    });
                });
            })(chartItem, chartArr, chartDiv, waveDataGroup, waveDataCount);

            /**
             var minLabel = document.createElement('div');
             minLabel.innerText = chartItem.yAxis[0].min;
             minLabel.style.width = '100px';
             minLabel.style.textAlign = 'right';
             minLabel.style.color = 'white';
             minLabel.style.left = '30px';
             minLabel.style.top = '40px';
             minLabel.style.position = 'absolute';
             minLabel.style.color = lineColor;
             channelDiv.appendChild(minLabel);

             var maxLabel = document.createElement('div');
             maxLabel.innerText = chartItem.yAxis[0].max;
             maxLabel.style.width = '100px';
             maxLabel.style.textAlign = 'right';
             maxLabel.style.color = 'white';
             maxLabel.style.left = '30px';
             maxLabel.style.bottom = '40px';
             maxLabel.style.position = 'absolute';
             maxLabel.style.color = lineColor;
             channelDiv.appendChild(maxLabel);
             **/

            chartArr.push(chartItem);
        })
    };

    var data = {"module.exports":[{"x":15,"y":7,"name":"In1","nameX":15,"nameY":6,"height":2,"width":8,"sign":"纵联差动保护动作","type1":"Input","type1X":15,"type1Y":6,"type2":"","id":0,"inputNum":0,"notGateNum":0,"showName":true,"showType":false,"showResult":false,"event":{"isEvent":false,"events":[],"waveLength":80,"triggerType":0,"state":false,"statusNumber":0}},{"x":6,"y":9,"name":"In2","nameX":6,"nameY":8,"height":2,"width":9,"sign":"工频变化量距离动作","type1":"Input","type1X":6,"type1Y":8,"type2":"","id":1,"inputNum":0,"notGateNum":0,"showName":true,"showType":false,"showResult":false,"event":{"isEvent":false,"events":[],"waveLength":80,"triggerType":0,"state":false,"statusNumber":0}},{"x":13,"y":11,"name":"In3","nameX":13,"nameY":10,"height":2,"width":8,"sign":"相间距离Ⅰ段动作","type1":"Input","type1X":13,"type1Y":10,"type2":"","id":2,"inputNum":0,"notGateNum":0,"showName":true,"showType":false,"showResult":false,"event":{"isEvent":false,"events":[],"waveLength":80,"triggerType":0,"state":false,"statusNumber":0}},{"x":6,"y":13,"name":"In4","nameX":6,"nameY":12,"height":2,"width":8,"sign":"接地距离Ⅰ段动作","type1":"Input","type1X":6,"type1Y":12,"type2":"","id":3,"inputNum":0,"notGateNum":0,"showName":true,"showType":false,"showResult":false,"event":{"isEvent":false,"events":[],"waveLength":80,"triggerType":0,"state":false,"statusNumber":0}},{"x":7,"y":17,"name":"In5","nameX":7,"nameY":16,"height":2,"width":8,"sign":"接地距离Ⅱ段动作","type1":"Input","type1X":7,"type1Y":16,"type2":"","id":4,"inputNum":0,"notGateNum":0,"showName":true,"showType":false,"showResult":false,"event":{"isEvent":false,"events":[],"waveLength":80,"triggerType":0,"state":false,"statusNumber":0}},{"x":14,"y":15,"name":"In6","nameX":14,"nameY":14,"height":2,"width":8,"sign":"相间距离Ⅱ段动作","type1":"Input","type1X":14,"type1Y":14,"type2":"","id":5,"inputNum":0,"notGateNum":0,"showName":true,"showType":false,"showResult":false,"event":{"isEvent":false,"events":[],"waveLength":80,"triggerType":0,"state":false,"statusNumber":0}},{"x":15,"y":19,"name":"In7","nameX":15,"nameY":18,"height":2,"width":6,"sign":"零序Ⅱ段动作","type1":"Input","type1X":15,"type1Y":18,"type2":"","id":6,"inputNum":0,"notGateNum":0,"showName":true,"showType":false,"showResult":false,"event":{"isEvent":false,"events":[],"waveLength":80,"triggerType":0,"state":false,"statusNumber":0}},{"x":7,"y":22,"name":"In8","nameX":7,"nameY":20,"height":2,"width":9,"sign":"通道一长期有差流_A","type1":"Input","type1X":7,"type1Y":21,"type2":"","id":7,"inputNum":0,"notGateNum":0,"showName":true,"showType":true,"showResult":true,"event":{"isEvent":false,"events":[],"waveLength":80,"triggerType":0,"state":false,"statusNumber":0}},{"x":29,"y":10,"name":"H1","nameX":29,"nameY":8,"height":8,"width":2,"sign":"","type1":"Or","type1X":29,"type1Y":9,"type2":"","id":8,"inputNum":7,"notGateNum":0,"showName":true,"showType":true,"showResult":true,"InputArray":[0,2,1,3,4,5,6],"event":{"isEvent":false,"events":[],"waveLength":80,"triggerType":0,"state":false,"statusNumber":0}},{"x":8,"y":29,"name":"In9","nameX":8,"nameY":27,"height":2,"width":9,"sign":"通道一长期有差流_B","type1":"Input","type1X":8,"type1Y":28,"type2":"","id":9,"inputNum":0,"notGateNum":0,"showName":true,"showType":true,"showResult":true,"event":{"isEvent":false,"events":[],"waveLength":80,"triggerType":0,"state":false,"statusNumber":0}},{"x":8,"y":36,"name":"In10","nameX":8,"nameY":34,"height":2,"width":9,"sign":"通道一长期有差流_C","type1":"Input","type1X":8,"type1Y":35,"type2":"","id":10,"inputNum":0,"notGateNum":0,"showName":true,"showType":true,"showResult":true,"event":{"isEvent":false,"events":[],"waveLength":80,"triggerType":0,"state":false,"statusNumber":0}},{"x":13,"y":26,"name":"In11","nameX":13,"nameY":25,"height":2,"width":4,"sign":"选出A相","type1":"Input","type1X":13,"type1Y":25,"type2":"","id":11,"inputNum":0,"notGateNum":0,"showName":true,"showType":false,"showResult":false,"event":{"isEvent":false,"events":[],"waveLength":80,"triggerType":0,"state":false,"statusNumber":0}},{"x":13,"y":33,"name":"In12","nameX":13,"nameY":31,"height":2,"width":4,"sign":"选出B相","type1":"Input","type1X":13,"type1Y":32,"type2":"","id":12,"inputNum":0,"notGateNum":0,"showName":true,"showType":true,"showResult":true,"event":{"isEvent":false,"events":[],"waveLength":80,"triggerType":0,"state":false,"statusNumber":0}},{"x":13,"y":40,"name":"In13","nameX":13,"nameY":38,"height":2,"width":4,"sign":"选出C相","type1":"Input","type1X":13,"type1Y":39,"type2":"","id":13,"inputNum":0,"notGateNum":0,"showName":true,"showType":true,"showResult":true,"event":{"isEvent":false,"events":[],"waveLength":80,"triggerType":0,"state":false,"statusNumber":0}},{"x":13,"y":45,"name":"In14","nameX":13,"nameY":43,"height":2,"width":3,"sign":"选多相","type1":"Input","type1X":13,"type1Y":44,"type2":"","id":14,"inputNum":0,"notGateNum":0,"showName":true,"showType":true,"showResult":true,"event":{"isEvent":false,"events":[],"waveLength":80,"triggerType":0,"state":false,"statusNumber":0}},{"x":30,"y":24,"name":"Y1","nameX":30,"nameY":22,"height":4,"width":2,"sign":"","type1":"And","type1X":30,"type1Y":23,"type2":"","id":15,"inputNum":2,"notGateNum":0,"showName":false,"showType":true,"showResult":true,"InputArray":[8,11],"event":{"isEvent":false,"events":[],"waveLength":80,"triggerType":0,"state":false,"statusNumber":0}},{"x":36,"y":25,"name":"H2","nameX":36,"nameY":23,"height":4,"width":2,"sign":"","type1":"Or","type1X":36,"type1Y":24,"type2":"","id":16,"inputNum":2,"notGateNum":0,"showName":true,"showType":true,"showResult":true,"InputArray":[15,17],"event":{"isEvent":false,"events":[],"waveLength":80,"triggerType":0,"state":false,"statusNumber":0}},{"x":42,"y":24,"name":"Y2","nameX":42,"nameY":22,"height":4,"width":2,"sign":"","type1":"And","type1X":42,"type1Y":23,"type2":"","id":17,"inputNum":2,"notGateNum":0,"showName":true,"showType":true,"showResult":true,"InputArray":[7,16],"event":{"isEvent":false,"events":[],"waveLength":80,"triggerType":0,"state":false,"statusNumber":0}},{"x":49,"y":25,"name":"H3","nameX":49,"nameY":23,"height":4,"width":2,"sign":"","type1":"Or","type1X":49,"type1Y":24,"type2":"","id":18,"inputNum":2,"notGateNum":0,"showName":true,"showType":true,"showResult":true,"InputArray":[17,35],"event":{"isEvent":false,"events":[],"waveLength":80,"triggerType":0,"state":false,"statusNumber":0}},{"x":61,"y":26,"name":"Out1","nameX":61,"nameY":24,"height":2,"width":4,"sign":"A相跳闸","type1":"Output","type1X":61,"type1Y":25,"type2":"","id":19,"inputNum":1,"notGateNum":0,"showName":true,"showType":true,"showResult":true,"InputArray":[18],"event":{"isEvent":false,"events":[],"waveLength":80,"triggerType":0,"state":false,"statusNumber":0}},{"x":61,"y":33,"name":"Out2","nameX":61,"nameY":31,"height":2,"width":4,"sign":"B相跳闸","type1":"Output","type1X":61,"type1Y":32,"type2":"","id":20,"inputNum":1,"notGateNum":0,"showName":true,"showType":true,"showResult":true,"InputArray":[23],"event":{"isEvent":false,"events":[],"waveLength":80,"triggerType":0,"state":false,"statusNumber":0}},{"x":36,"y":32,"name":"H4","nameX":36,"nameY":30,"height":4,"width":2,"sign":"","type1":"Or","type1X":36,"type1Y":31,"type2":"","id":21,"inputNum":2,"notGateNum":0,"showName":true,"showType":true,"showResult":true,"InputArray":[27,22],"event":{"isEvent":false,"events":[],"waveLength":80,"triggerType":0,"state":false,"statusNumber":0}},{"x":42,"y":31,"name":"Y3","nameX":42,"nameY":29,"height":4,"width":2,"sign":"","type1":"And","type1X":42,"type1Y":30,"type2":"","id":22,"inputNum":2,"notGateNum":0,"showName":true,"showType":true,"showResult":true,"InputArray":[9,21],"event":{"isEvent":false,"events":[],"waveLength":80,"triggerType":0,"state":false,"statusNumber":0}},{"x":49,"y":32,"name":"H5","nameX":49,"nameY":30,"height":4,"width":2,"sign":"","type1":"Or","type1X":49,"type1Y":31,"type2":"","id":23,"inputNum":2,"notGateNum":0,"showName":true,"showType":true,"showResult":true,"InputArray":[22,35],"event":{"isEvent":false,"events":[],"waveLength":80,"triggerType":0,"state":false,"statusNumber":0}},{"x":36,"y":39,"name":"H6","nameX":36,"nameY":37,"height":4,"width":2,"sign":"","type1":"Or","type1X":36,"type1Y":38,"type2":"","id":24,"inputNum":2,"notGateNum":0,"showName":true,"showType":true,"showResult":true,"InputArray":[28,25],"event":{"isEvent":false,"events":[],"waveLength":80,"triggerType":0,"state":false,"statusNumber":0}},{"x":42,"y":38,"name":"Y6","nameX":42,"nameY":36,"height":4,"width":2,"sign":"","type1":"And","type1X":42,"type1Y":37,"type2":"","id":25,"inputNum":2,"notGateNum":0,"showName":true,"showType":true,"showResult":true,"InputArray":[10,24],"event":{"isEvent":false,"events":[],"waveLength":80,"triggerType":0,"state":false,"statusNumber":0}},{"x":49,"y":39,"name":"H7","nameX":49,"nameY":37,"height":4,"width":2,"sign":"","type1":"Or","type1X":49,"type1Y":38,"type2":"","id":26,"inputNum":2,"notGateNum":0,"showName":true,"showType":true,"showResult":true,"InputArray":[25,35],"event":{"isEvent":false,"events":[],"waveLength":80,"triggerType":0,"state":false,"statusNumber":0}},{"x":30,"y":31,"name":"Y4","nameX":30,"nameY":29,"height":4,"width":2,"sign":"","type1":"And","type1X":30,"type1Y":30,"type2":"","id":27,"inputNum":2,"notGateNum":0,"showName":true,"showType":true,"showResult":true,"InputArray":[8,12],"event":{"isEvent":false,"events":[],"waveLength":80,"triggerType":0,"state":false,"statusNumber":0}},{"x":30,"y":38,"name":"Y5","nameX":30,"nameY":36,"height":4,"width":2,"sign":"","type1":"And","type1X":30,"type1Y":37,"type2":"","id":28,"inputNum":2,"notGateNum":0,"showName":true,"showType":true,"showResult":true,"InputArray":[8,13],"event":{"isEvent":false,"events":[],"waveLength":80,"triggerType":0,"state":false,"statusNumber":0}},{"x":61,"y":40,"name":"Out3","nameX":61,"nameY":38,"height":2,"width":4,"sign":"C相跳闸","type1":"Output","type1X":61,"type1Y":39,"type2":"","id":29,"inputNum":1,"notGateNum":0,"showName":true,"showType":true,"showResult":true,"InputArray":[26],"event":{"isEvent":false,"events":[],"waveLength":80,"triggerType":0,"state":false,"statusNumber":0}},{"x":30,"y":43,"name":"Y7","nameX":30,"nameY":42,"height":4,"width":2,"sign":"","type1":"And","type1X":30,"type1Y":42,"type2":"","id":30,"inputNum":2,"notGateNum":0,"showName":true,"showType":false,"showResult":false,"InputArray":[8,14],"event":{"isEvent":false,"events":[],"waveLength":80,"triggerType":0,"state":false,"statusNumber":0}},{"x":30,"y":48,"name":"Y8","nameX":30,"nameY":47,"height":6,"width":2,"sign":"","type1":"And","type1X":30,"type1Y":47,"type2":"","id":31,"inputNum":5,"notGateNum":4,"showName":true,"showType":false,"showResult":false,"InputArray":[14,13,12,11,8],"event":{"isEvent":false,"events":[],"waveLength":80,"triggerType":0,"state":false,"statusNumber":0}},{"x":11,"y":54,"name":"In16","nameX":11,"nameY":53,"height":2,"width":5,"sign":"任一相有流","type1":"Input","type1X":11,"type1Y":53,"type2":"","id":32,"inputNum":0,"notGateNum":0,"showName":true,"showType":false,"showResult":false,"event":{"isEvent":false,"events":[],"waveLength":80,"triggerType":0,"state":false,"statusNumber":0}},{"x":35,"y":50,"name":"T1","nameX":35,"nameY":49,"height":2,"width":3,"sign":"200/0","type1":"Time","type1X":35,"type1Y":49,"type2":"ConstantTime","id":33,"inputNum":1,"notGateNum":0,"showName":true,"showType":false,"showResult":false,"InputArray":[31],"event":{"isEvent":false,"events":[],"waveLength":80,"triggerType":0,"state":false,"statusNumber":0}},{"x":40,"y":46,"name":"H8","nameX":40,"nameY":45,"height":4,"width":2,"sign":"","type1":"Or","type1X":40,"type1Y":45,"type2":"","id":34,"inputNum":3,"notGateNum":0,"showName":true,"showType":false,"showResult":false,"InputArray":[35,30,33],"event":{"isEvent":false,"events":[],"waveLength":80,"triggerType":0,"state":false,"statusNumber":0}},{"x":44,"y":49,"name":"Y9","nameX":44,"nameY":48,"height":4,"width":2,"sign":"","type1":"And","type1X":44,"type1Y":48,"type2":"","id":35,"inputNum":2,"notGateNum":0,"showName":true,"showType":false,"showResult":false,"InputArray":[34,32],"event":{"isEvent":false,"events":[],"waveLength":80,"triggerType":0,"state":false,"statusNumber":0}},{"x":61,"y":53,"name":"Out4","nameX":61,"nameY":52,"height":2,"width":4,"sign":"选相无效","type1":"Output","type1X":61,"type1Y":52,"type2":"","id":36,"inputNum":1,"notGateNum":0,"showName":true,"showType":false,"showResult":false,"InputArray":[31],"event":{"isEvent":false,"events":[],"waveLength":80,"triggerType":0,"state":false,"statusNumber":0}},{"x":27,"y":25,"type1":"LinkPoint"},{"x":46,"y":26,"type1":"LinkPoint"},{"x":46,"y":33,"type1":"LinkPoint"},{"x":27,"y":32,"type1":"LinkPoint"},{"x":27,"y":42,"type1":"LinkPoint"},{"x":46,"y":40,"type1":"LinkPoint"},{"x":27,"y":39,"type1":"LinkPoint"},{"x":27,"y":44,"type1":"LinkPoint"},{"x":28,"y":46,"type1":"LinkPoint"},{"x":26,"y":41,"type1":"LinkPoint"},{"x":24,"y":27,"type1":"LinkPoint"},{"x":25,"y":34,"type1":"LinkPoint"},{"x":47,"y":45,"type1":"LinkPoint"},{"x":47,"y":35,"type1":"LinkPoint"},{"x":47,"y":42,"type1":"LinkPoint"},{"x":34,"y":51,"type1":"LinkPoint"},{"x":7,"y":57,"type1":"Text","sign":"12345"},{"type1":"LinkLine","points":[{"x":17,"y":27},{"x":29,"y":27}]},{"type1":"LinkLine","points":[{"x":29,"y":25},{"x":27,"y":25}]},{"type1":"LinkLine","points":[{"x":33,"y":26},{"x":35,"y":26}]},{"type1":"LinkLine","points":[{"x":39,"y":27},{"x":41,"y":27}]},{"type1":"LinkLine","points":[{"x":17,"y":23},{"x":18,"y":23},{"x":18,"y":23},{"x":40,"y":23},{"x":40,"y":25},{"x":41,"y":25}]},{"type1":"LinkLine","points":[{"x":45,"y":26},{"x":48,"y":26}]},{"type1":"LinkLine","points":[{"x":46,"y":26},{"x":46,"y":29},{"x":46,"y":30},{"x":34,"y":30},{"x":34,"y":28},{"x":35,"y":28}]},{"type1":"LinkLine","points":[{"x":48,"y":28},{"x":47,"y":28},{"x":47,"y":51}]},{"type1":"LinkLine","points":[{"x":33,"y":33},{"x":35,"y":33}]},{"type1":"LinkLine","points":[{"x":39,"y":34},{"x":41,"y":34}]},{"type1":"LinkLine","points":[{"x":45,"y":33},{"x":48,"y":33}]},{"type1":"LinkLine","points":[{"x":46,"y":33},{"x":46,"y":36},{"x":46,"y":37},{"x":34,"y":37},{"x":34,"y":35},{"x":35,"y":35}]},{"type1":"LinkLine","points":[{"x":17,"y":34},{"x":29,"y":34}]},{"type1":"LinkLine","points":[{"x":29,"y":32},{"x":27,"y":32}]},{"type1":"LinkLine","points":[{"x":41,"y":32},{"x":40,"y":32},{"x":40,"y":31},{"x":33,"y":31},{"x":33,"y":30},{"x":17,"y":30}]},{"type1":"LinkLine","points":[{"x":52,"y":34},{"x":60,"y":34}]},{"type1":"LinkLine","points":[{"x":52,"y":27},{"x":60,"y":27}]},{"type1":"LinkLine","points":[{"x":15,"y":14},{"x":28,"y":14}]},{"type1":"LinkLine","points":[{"x":22,"y":12},{"x":28,"y":12}]},{"type1":"LinkLine","points":[{"x":28,"y":11},{"x":26,"y":11},{"x":26,"y":8},{"x":23,"y":8}]},{"type1":"LinkLine","points":[{"x":28,"y":13},{"x":25,"y":13},{"x":25,"y":10},{"x":15,"y":10}]},{"type1":"LinkLine","points":[{"x":23,"y":16},{"x":28,"y":16}]},{"type1":"LinkLine","points":[{"x":28,"y":17},{"x":26,"y":17},{"x":26,"y":20},{"x":21,"y":20}]},{"type1":"LinkLine","points":[{"x":28,"y":15},{"x":25,"y":15},{"x":25,"y":18},{"x":15,"y":18}]},{"type1":"LinkLine","points":[{"x":32,"y":14},{"x":35,"y":14},{"x":35,"y":21},{"x":27,"y":21},{"x":27,"y":53}]},{"type1":"LinkLine","points":[{"x":17,"y":34},{"x":29,"y":34}]},{"type1":"LinkLine","points":[{"x":39,"y":34},{"x":41,"y":34}]},{"type1":"LinkLine","points":[{"x":33,"y":40},{"x":35,"y":40}]},{"type1":"LinkLine","points":[{"x":39,"y":41},{"x":41,"y":41}]},{"type1":"LinkLine","points":[{"x":45,"y":40},{"x":48,"y":40}]},{"type1":"LinkLine","points":[{"x":46,"y":40},{"x":46,"y":43},{"x":46,"y":44},{"x":34,"y":44},{"x":34,"y":42},{"x":35,"y":42}]},{"type1":"LinkLine","points":[{"x":17,"y":41},{"x":29,"y":41}]},{"type1":"LinkLine","points":[{"x":29,"y":39},{"x":27,"y":39}]},{"type1":"LinkLine","points":[{"x":41,"y":39},{"x":40,"y":39},{"x":40,"y":38},{"x":33,"y":38},{"x":33,"y":37},{"x":17,"y":37}]},{"type1":"LinkLine","points":[{"x":52,"y":41},{"x":60,"y":41}]},{"type1":"LinkLine","points":[{"x":52,"y":34},{"x":60,"y":34}]},{"type1":"LinkLine","points":[{"x":29,"y":44},{"x":27,"y":44}]},{"type1":"LinkLine","points":[{"x":29,"y":53},{"x":27,"y":53}]},{"type1":"LinkLine","points":[{"x":29,"y":46},{"x":17,"y":46}]},{"type1":"LinkLine","points":[{"x":29,"y":49},{"x":28,"y":49},{"x":28,"y":46}]},{"type1":"LinkLine","points":[{"x":29,"y":50},{"x":26,"y":50},{"x":26,"y":41}]},{"type1":"LinkLine","points":[{"x":29,"y":51},{"x":25,"y":51},{"x":25,"y":34}]},{"type1":"LinkLine","points":[{"x":29,"y":52},{"x":24,"y":52},{"x":24,"y":27}]},{"type1":"LinkLine","points":[{"x":33,"y":51},{"x":34,"y":51}]},{"type1":"LinkLine","points":[{"x":39,"y":47},{"x":38,"y":47},{"x":38,"y":45},{"x":47,"y":45}]},{"type1":"LinkLine","points":[{"x":43,"y":50},{"x":43,"y":48}]},{"type1":"LinkLine","points":[{"x":39,"y":51},{"x":39,"y":49}]},{"type1":"LinkLine","points":[{"x":39,"y":48},{"x":37,"y":48},{"x":37,"y":45},{"x":33,"y":45}]},{"type1":"LinkLine","points":[{"x":48,"y":35},{"x":47,"y":35}]},{"type1":"LinkLine","points":[{"x":48,"y":42},{"x":47,"y":42}]},{"type1":"LinkLine","points":[{"x":60,"y":54},{"x":34,"y":54},{"x":34,"y":51}]},{"type1":"LinkLine","points":[{"x":17,"y":55},{"x":42,"y":55},{"x":42,"y":52},{"x":43,"y":52}]}]};
    $.loadGrpData(data['module.exports']);

    var cfgStr = "CYGSR,202,1999\n" +
        "67,27A,40D\n" +
        "1,0-Ia,A,,A,0.002000,0.000000,0.000000,-32767,32767,4000,1,S\n" +
        "2,1-Ib,B,,A,0.002000,0.000000,0.000000,-32767,32767,4000,1,S\n" +
        "3,2-Ic,C,,A,0.002000,0.000000,0.000000,-32767,32767,4000,1,S\n" +
        "4,3-Ua,A,,V,0.010030,0.000000,0.000000,-32767,32767,288683,58,S\n" +
        "5,4-Ub,B,,V,0.010030,0.000000,0.000000,-32767,32767,288683,58,S\n" +
        "6,5-Uc,C,,V,0.010030,0.000000,0.000000,-32767,32767,288683,58,S\n" +
        "8,7-Ia1,A,,A,0.002000,0.000000,0.000000,-32767,32767,4000,1,S\n" +
        "9,8-Ib1,B,,A,0.002000,0.000000,0.000000,-32767,32767,4000,1,S\n" +
        "10,9-Ic1,C,,A,0.002000,0.000000,0.000000,-32767,32767,4000,1,S\n" +
        "11,10-Ia2,A,,A,0.002000,0.000000,0.000000,-32767,32767,4000,1,S\n" +
        "12,11-Ib2,B,,A,0.002000,0.000000,0.000000,-32767,32767,4000,1,S\n" +
        "13,12-Ic2,C,,A,0.002000,0.000000,0.000000,-32767,32767,4000,1,S\n" +
        "27,26-mIa,A,,A,0.002000,0.000000,0.000000,-32767,32767,4000,1,S\n" +
        "28,27-mIb,B,,A,0.002000,0.000000,0.000000,-32767,32767,4000,1,S\n" +
        "29,28-mIc,C,,A,0.002000,0.000000,0.000000,-32767,32767,4000,1,S\n" +
        "30,29-mUa,A,,V,0.010030,0.000000,0.000000,-32767,32767,288683,58,S\n" +
        "31,30-mUb,B,,V,0.010030,0.000000,0.000000,-32767,32767,288683,58,S\n" +
        "32,31-mUc,C,,V,0.010030,0.000000,0.000000,-32767,32767,288683,58,S\n" +
        "34,33-nIa,A,,A,0.002000,0.000000,0.000000,-32767,32767,4000,1,S\n" +
        "35,34-nIb,B,,A,0.002000,0.000000,0.000000,-32767,32767,4000,1,S\n" +
        "36,35-nIc,C,,A,0.002000,0.000000,0.000000,-32767,32767,4000,1,S\n" +
        "37,36-nUa,A,,V,0.010030,0.000000,0.000000,-32767,32767,288683,58,S\n" +
        "38,37-nUb,B,,V,0.010030,0.000000,0.000000,-32767,32767,288683,58,S\n" +
        "39,38-nUc,C,,V,0.010030,0.000000,0.000000,-32767,32767,288683,58,S\n" +
        "40,39-Ida,A,,A,0.002000,0.000000,0.000000,-32767,32767,4000,1,S\n" +
        "41,40-Idb,B,,A,0.002000,0.000000,0.000000,-32767,32767,4000,1,S\n" +
        "42,41-Idc,C,,A,0.002000,0.000000,0.000000,-32767,32767,4000,1,S\n" +
        "4,4-4-边断路器分相跳闸位置TWJa,,,0\n" +
        "5,5-5-边断路器分相跳闸位置TWJb,,,0\n" +
        "6,6-6-边断路器分相跳闸位置TWJc,,,0\n" +
        "7,7-7-中断路器分相跳闸位置TWJa,,,0\n" +
        "8,8-8-中断路器分相跳闸位置TWJb,,,0\n" +
        "9,9-9-中断路器分相跳闸位置TWJc,,,0\n" +
        "10,10-10-远传1-1,,,0\n" +
        "11,11-11-远传1-2,,,0\n" +
        "12,12-12-远传1-3,,,0\n" +
        "13,13-13-远传1-4,,,0\n" +
        "14,14-14-远传1-5,,,0\n" +
        "15,15-15-远传1-6,,,0\n" +
        "16,16-16-远传2-1,,,0\n" +
        "17,17-17-远传2-2,,,0\n" +
        "18,18-18-远传2-3,,,0\n" +
        "19,19-19-远传2-4,,,0\n" +
        "20,20-20-远传2-5,,,0\n" +
        "21,21-21-远传2-6,,,0\n" +
        "22,22-22-其它保护动作-1,,,0\n" +
        "23,23-23-其它保护动作-2,,,0\n" +
        "24,24-24-其它保护动作-3,,,0\n" +
        "25,25-25-其它保护动作-4,,,0\n" +
        "26,26-26-其它保护动作-5,,,0\n" +
        "27,27-27-其它保护动作-6,,,0\n" +
        "35,36-36-远方操作,,,0\n" +
        "36,35-35-保护检修状态,,,0\n" +
        "37,37-37-信号复归,,,0\n" +
        "38,50-50-跳断路器A相,,,0\n" +
        "39,51-51-跳断路器B相,,,0\n" +
        "40,52-52-跳断路器C相,,,0\n" +
        "41,53-53-重合闸,,,0\n" +
        "42,54-54-开出闭锁重合闸,,,0\n" +
        "43,55-55-三相不一致跳闸,,,0\n" +
        "44,56-56-过电压远跳发信,,,0\n" +
        "45,57-57-远传1开出,,,0\n" +
        "46,58-58-远传2开出,,,0\n" +
        "47,59-59-通道故障,,,0\n" +
        "48,60-60-充电满,,,0\n" +
        "49,61-61-差动启动,,,0\n" +
        "50,62-62-后备启动,,,0\n" +
        "50\n" +
        "2\n" +
        "1000.0000,160\n" +
        "25.0000,334\n" +
        "05/09/2018,11:03:28.080000\n" +
        "05/09/2018,11:03:28.120000\n" +
        "ASCII\n" +
        "1.00\n";
    cfgStr = cfgStr.split('\n');
    var cfgCount = cfgStr[1].split(',');
    // 模拟量数量
    var analogQuantityCount = parseInt(cfgCount[1]);
    cfgCount = parseInt(cfgCount[0]);
    var cfgResultData = cfgStr.slice(2, 2 + cfgCount);
    cfgResultData = cfgResultData.map(function (data, cfgIndex) {
        var dataArr = data.split(',');
        return {
            id: dataArr[0],
            name: dataArr[1].replace(/\s*$/, ''),
            type: dataArr[2],
            percentage: dataArr[3],
            unit: dataArr[4],
            fCoefA: parseFloat(dataArr[5]),
            fCoefB: parseFloat(dataArr[6]),
            isAnalog: cfgIndex < analogQuantityCount
        }
    });
    window.cfgResultData = cfgResultData;

    var midStr = "1,0,-00006,00012,-00010,-07213,-00263,07501,-00004,00007,-00005,-00002,00005,-00005,00007,00000,-00009,-04481,08478,-03976,-00025,-00003,00020,-04332,08457,-04007,-00018,-00003,00011,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\n" +
        "2,1000,-00008,00011,-00005,-05519,-02806,08361,-00005,00006,-00003,-00003,00005,-00002,00006,00001,-00012,-06531,07977,-01430,-00021,-00009,00022,-06343,08011,-01507,-00015,-00008,00010,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\n" +
        "3,2000,-00012,00012,-00001,-03147,-05228,08415,-00008,00007,-00001,-00004,00005,00000,00002,00005,-00012,-07892,06735,01160,-00014,-00014,00022,-07755,06810,01083,-00012,-00009,00010,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\n" +
        "4,3000,-00016,00009,00000,-00557,-07076,07648,-00009,00006,00000,-00007,00003,00000,00000,00006,-00012,-08462,04804,03641,-00005,-00021,00020,-08381,04897,03631,-00005,-00015,00008,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\n" +
        "5,4000,-00014,00005,00002,02022,-08203,06175,-00009,00003,00000,-00005,00002,00002,-00001,00010,-00013,-08239,02332,05913,00002,-00027,00017,-08201,02486,05832,00001,-00017,00004,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\n" +
        "6,5000,-00012,00001,00005,04487,-08470,03990,-00008,00001,00001,-00004,00000,00004,-00006,00012,-00010,-07213,-00263,07501,00008,-00025,00013,-07237,-00083,07440,00002,-00013,00003,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\n" +
        "7,6000,-00011,-00001,00007,06531,-07969,01445,-00007,-00001,00002,-00004,00000,00005,-00008,00011,-00005,-05519,-02806,08361,00015,-00025,00006,-05551,-02678,08327,00007,-00014,00001,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\n" +
        "8,7000,-00008,-00003,00006,07908,-06732,-01146,-00005,-00002,00002,-00003,-00001,00004,-00012,00012,-00001,-03147,-05228,08415,00020,-00025,-00003,-03249,-05074,08391,00008,-00013,-00004,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\n" +
        "9,8000,-00006,-00003,00007,08472,-04802,-03626,-00004,-00002,00003,-00002,-00001,00004,-00016,00009,00000,-00557,-07076,07648,00020,-00021,-00009,-00714,-06923,07656,00004,-00012,-00009,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\n" +
        "10,9000,-00003,-00006,00007,08247,-02329,-05896,-00002,-00003,00003,-00001,-00003,00004,-00014,00005,00002,02022,-08203,06175,00020,-00012,-00016,01889,-08092,06166,00006,-00007,-00014,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\n" +
        "11,10000,00001,-00008,00005,07230,00266,-07491,00000,-00004,00001,00001,-00004,00004,-00012,00001,00005,04487,-08470,03990,00020,-00003,-00021,04361,-08446,04004,00008,-00002,-00016,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\n" +
        "12,11000,00002,-00008,00002,05535,02811,-08350,00001,-00004,00000,00001,-00004,00002,-00011,-00001,00007,06531,-07969,01445,00013,00004,-00025,06378,-07999,01504,00002,00003,-00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\n" +
        "13,12000,00004,-00008,-00002,03158,05238,-08405,00003,-00004,-00002,00001,-00004,00000,-00008,-00003,00006,07908,-06732,-01146,00008,00008,-00023,07793,-06805,-01086,00000,00005,-00017,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\n" +
        "14,13000,00006,-00007,-00003,00571,07079,-07641,00003,-00004,-00003,00003,-00003,00000,-00006,-00003,00007,08472,-04802,-03626,-00003,00017,-00023,08418,-04896,-03631,-00009,00014,-00016,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\n" +
        "15,14000,00006,-00003,-00008,-02006,08213,-06169,00003,-00001,-00006,00003,-00002,-00002,-00003,-00006,00007,08247,-02329,-05896,-00005,00020,-00021,08243,-02487,-05836,-00008,00014,-00014,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\n" +
        "16,15000,00007,-00001,-00009,-04471,08480,-03989,00005,00000,-00006,00002,-00001,-00003,00001,-00008,00005,07230,00266,-07491,-00014,00020,-00014,07283,00083,-07443,-00013,00012,-00009,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\n" +
        "17,16000,00005,00002,-00011,-06525,07980,-01439,00003,00002,-00007,00002,00000,-00004,00002,-00008,00002,05535,02811,-08350,-00021,00020,-00007,05594,02684,-08337,-00019,00012,-00005,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\n" +
        "18,17000,00001,00004,-00011,-07886,06741,01148,00000,00004,-00007,00001,00000,-00004,00004,-00008,-00002,03158,05238,-08405,-00025,00020,-00003,03289,05082,-08401,-00021,00012,-00005,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\n" +
        "19,18000,00000,00008,-00012,-08459,04815,03627,00000,00006,-00007,00000,00002,-00005,00006,-00007,-00003,00571,07079,-07641,-00025,00013,00006,00758,06931,-07669,-00019,00006,00003,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\n" +
        "20,19000,00000,00011,-00013,-08244,02346,05903,00000,00007,-00007,00000,00004,-00006,00006,-00003,-00008,-02006,08213,-06169,-00027,00006,00015,-01846,08105,-06179,-00021,00003,00007,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\n" +
        "21,20000,-00006,00011,-00009,-07220,-00253,07497,-00004,00006,-00005,-00002,00005,-00004,00007,-00001,-00009,-04471,08480,-03989,-00025,-00003,00020,-04319,08457,-04020,-00018,-00004,00011,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\n" +
        "22,21000,-00008,00011,-00005,-05531,-02793,08360,-00006,00006,-00003,-00002,00005,-00002,00005,00002,-00011,-06525,07980,-01439,-00018,-00009,00024,-06338,08016,-01519,-00013,-00007,00013,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\n" +
        "23,22000,-00010,00011,-00003,-03162,-05216,08417,-00006,00007,-00002,-00004,00004,-00001,00001,00004,-00011,-07886,06741,01148,-00014,-00014,00022,-07750,06819,01069,-00013,-00010,00011,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\n" +
        "24,23000,-00013,00008,00000,-00574,-07065,07653,-00009,00005,00000,-00004,00003,00000,00000,00008,-00012,-08459,04815,03627,-00005,-00021,00020,-08380,04909,03617,-00005,-00013,00008,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\n" +
        "25,24000,-00012,00005,00004,02009,-08200,06186,-00008,00003,00001,-00004,00002,00003,00000,00011,-00013,-08244,02346,05903,00002,-00025,00017,-08205,02502,05823,00002,-00014,00004,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\n" +
        "26,25000,-00012,00002,00006,04478,-08475,04005,-00008,00002,00002,-00004,00000,00004,-00006,00011,-00009,-07220,-00253,07497,00008,-00027,00013,-07246,-00070,07433,00002,-00016,00004,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\n" +
        "27,26000,-00012,00000,00006,06526,-07977,01458,-00008,00000,00002,-00004,00000,00004,-00008,00011,-00005,-05531,-02793,08360,00015,-00027,00006,-05562,-02663,08323,00007,-00016,00001,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\n" +
        "28,27000,-00008,-00003,00006,07900,-06735,-01133,-00005,-00002,00002,-00003,-00001,00004,-00010,00011,-00003,-03162,-05216,08417,00020,-00025,-00003,-03259,-05064,08395,00010,-00014,-00006,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\n" +
        "29,28000,-00006,-00005,00006,08470,-04813,-03612,-00004,-00002,00002,-00002,-00003,00004,-00013,00008,00000,-00574,-07065,07653,00022,-00018,-00009,-00729,-06913,07661,00009,-00010,-00009,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\n" +
        "30,29000,-00003,-00007,00007,08254,-02346,-05886,-00002,-00004,00002,-00001,-00003,00005,-00012,00005,00004,02009,-08200,06186,00020,-00009,-00016,01877,-08089,06174,00008,-00004,-00012,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\n" +
        "31,30000,00000,-00009,00004,07238,00253,-07484,00000,-00005,00000,00000,-00004,00004,-00012,00002,00006,04478,-08475,04005,00020,-00003,-00021,04349,-08451,04015,00008,-00001,-00015,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\n" +
        "32,31000,00002,-00008,00003,05541,02801,-08346,00001,-00004,00000,00001,-00004,00003,-00012,00000,00006,06526,-07977,01458,00013,00004,-00023,06373,-08005,01516,00001,00004,-00017,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\n" +
        "33,32000,00005,-00008,-00002,03171,05227,-08407,00004,-00004,-00002,00001,-00004,00000,-00008,-00003,00006,07900,-06735,-01133,00006,00011,-00025,07786,-06805,-01077,-00002,00008,-00019,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\n" +
        "34,33000,00006,-00007,-00004,00586,07070,-07645,00003,-00003,-00004,00003,-00004,00000,-00006,-00005,00006,08470,-04813,-03612,-00003,00015,-00025,08418,-04907,-03616,-00009,00010,-00019,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\n" +
        "35,34000,00009,-00001,-00016,-01943,08242,-05848,00005,00000,-00010,00004,-00001,-00006,-00003,-00007,00007,08254,-02346,-05886,-00007,00020,-00021,08246,-02499,-05829,-00010,00013,-00014,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\n" +
        "36,35000,00009,00001,-00031,-04453,08479,-03650,00005,00001,-00017,00004,00000,-00014,00000,-00009,00004,07238,00253,-07484,-00014,00020,-00014,07290,00071,-07437,-00014,00011,-00010,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\n" +
        "37,36000,00007,00002,-00029,-06673,07850,-01538,00004,00002,-00016,00003,00000,-00013,00002,-00008,00003,05541,02801,-08346,-00021,00020,-00009,05602,02673,-08331,-00019,00012,-00006,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\n" +
        "38,37000,00004,00005,-00022,-07822,06852,00856,00003,00004,-00012,00001,00001,-00010,00005,-00008,-00002,03171,05227,-08407,-00025,00017,-00003,03301,05072,-08401,-00020,00009,-00005,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\n" +
        "39,38000,00000,00007,-00007,-08416,04862,03161,00000,00005,-00004,00000,00002,-00003,00006,-00007,-00004,00586,07070,-07645,-00027,00015,00008,00774,06920,-07610,-00021,00008,00004,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\n" +
        "40,39000,-00002,00010,00002,-08260,02347,05533,-00002,00006,00000,00000,00004,00002,00009,-00001,-00016,-01943,08242,-05848,-00027,00002,00026,-01705,08221,-05695,-00018,00001,00010,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\n" +
        "41,40000,-00010,00007,00023,-07251,-00214,06925,-00007,00004,00011,-00003,00003,00012,00009,00001,-00031,-04453,08479,-03650,-00025,-00003,00035,-04369,08393,-03848,-00016,-00002,00004,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "42,41000,-00015,00002,00048,-05496,-02680,07654,-00009,00001,00024,-00006,00001,00024,00007,00002,-00029,-06673,07850,-01538,-00021,-00009,00035,-06409,07966,-01614,-00014,-00007,00006,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "43,42000,-00021,00000,00067,-03114,-05107,07814,-00014,00000,00033,-00007,00000,00034,00004,00005,-00022,-07822,06852,00856,-00012,-00016,00029,-07732,06840,00649,-00008,-00011,00007,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "44,43000,-00024,-00002,00086,-00629,-07066,07260,-00016,-00002,00042,-00008,00000,00044,00000,00007,-00007,-08416,04862,03161,-00005,-00021,00017,-08463,04832,03067,-00005,-00014,00010,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "45,44000,-00027,-00010,00104,02013,-08176,05952,-00017,-00007,00051,-00010,-00003,00053,-00002,00010,00002,-08260,02347,05533,00004,-00023,-00003,-08253,02468,05209,00002,-00013,-00001,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "46,45000,-00026,-00013,00112,04534,-08425,03845,-00017,-00009,00055,-00009,-00004,00057,-00010,00007,00023,-07251,-00214,06925,00013,-00021,-00027,-07414,-00172,06537,00003,-00014,-00004,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "47,46000,-00024,-00013,00105,06619,-07913,01552,-00016,-00008,00051,-00008,-00005,00054,-00015,00002,00048,-05496,-02680,07654,00024,-00018,-00050,-05594,-02638,07434,00009,-00016,-00002,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "48,47000,-00019,-00016,00092,07887,-06754,-00699,-00013,-00010,00044,-00006,-00006,00048,-00021,00000,00067,-03114,-05107,07814,00029,-00014,-00072,-03388,-05130,07509,00008,-00014,-00005,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "49,48000,-00014,-00017,00073,08401,-04844,-02991,-00010,-00010,00035,-00004,-00007,00038,-00024,-00002,00086,-00629,-07066,07260,00031,-00005,-00097,-00821,-06964,07074,00007,-00007,-00011,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "50,49000,-00009,-00017,00048,08250,-02330,-05151,-00006,-00010,00022,-00003,-00007,00026,-00027,-00010,00104,02013,-08176,05952,00035,00004,-00117,01809,-08133,05707,00008,-00006,-00013,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "51,50000,-00003,-00014,00016,07249,00195,-06654,-00002,-00007,00006,-00001,-00007,00010,-00026,-00013,00112,04534,-08425,03845,00031,00013,-00123,04392,-08415,03874,00005,00000,-00011,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "52,51000,00002,-00008,-00014,05520,02654,-07490,00002,-00004,-00009,00000,-00004,-00005,-00024,-00013,00105,06619,-07913,01552,00026,00017,-00119,06440,-07951,01690,00002,00004,-00014,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "53,52000,00008,-00006,-00038,03178,05114,-07705,00005,-00002,-00021,00003,-00004,-00017,-00019,-00016,00092,07887,-06754,-00699,00020,00024,-00108,07832,-06752,-00475,00001,00008,-00016,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "54,53000,00014,-00001,-00062,00610,07014,-07147,00008,00001,-00033,00006,-00002,-00029,-00014,-00017,00073,08401,-04844,-02991,00008,00026,-00088,08475,-04812,-02777,-00006,00009,-00015,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "55,54000,00015,00003,-00080,-01970,08163,-05822,00009,00003,-00042,00006,00000,-00038,-00009,-00017,00048,08250,-02330,-05151,-00003,00029,-00059,08371,-02363,-04728,-00012,00012,-00011,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "56,55000,00014,00007,-00089,-04489,08418,-03820,00009,00006,-00046,00005,00001,-00043,-00003,-00014,00016,07249,00195,-06654,-00012,00024,-00023,07434,00153,-06240,-00015,00010,-00007,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "57,56000,00013,00013,-00087,-06544,07945,-01546,00008,00009,-00045,00005,00004,-00042,00002,-00008,-00014,05520,02654,-07490,-00023,00020,00008,05737,02705,-07134,-00021,00012,-00006,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "58,57000,00009,00014,-00074,-07855,06753,00772,00006,00009,-00038,00003,00005,-00036,00008,-00006,-00038,03178,05114,-07705,-00030,00013,00040,03447,05111,-07393,-00022,00007,00002,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "59,58000,00002,00015,-00057,-08395,04838,03028,00001,00010,-00029,00001,00005,-00028,00014,-00001,-00062,00610,07014,-07147,-00034,00006,00067,00901,06979,-06868,-00020,00005,00005,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "60,59000,00000,00015,-00034,-08208,02388,05164,00000,00009,-00018,00000,00006,-00016,00015,00003,-00080,-01970,08163,-05822,-00034,-00005,00087,-01728,08134,-05631,-00019,-00002,00007,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "61,60000,-00005,00011,-00005,-07232,-00129,06667,-00003,00007,-00003,-00002,00004,-00002,00014,00007,-00089,-04489,08418,-03820,-00034,-00014,00100,-04287,08448,-03780,-00020,-00007,00011,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "62,61000,-00011,00006,00019,-05544,-02620,07586,-00007,00004,00009,-00004,00002,00010,00013,00013,-00087,-06544,07945,-01546,-00027,-00021,00098,-06329,07989,-01667,-00014,-00008,00011,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "63,62000,-00017,00005,00044,-03225,-05101,07765,-00012,00003,00022,-00005,00002,00022,00009,00014,-00074,-07855,06753,00772,-00021,-00025,00087,-07755,06776,00567,-00012,-00011,00013,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "64,63000,-00021,00001,00068,-00627,-06993,07147,-00014,00000,00033,-00007,00001,00035,00002,00015,-00057,-08395,04838,03028,-00012,-00032,00069,-08403,04841,02800,-00010,-00017,00012,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "65,64000,-00022,-00005,00085,01993,-08128,05841,-00014,-00004,00042,-00008,-00001,00043,00000,00015,-00034,-08208,02388,05164,-00003,-00027,00042,-08301,02434,04784,-00003,-00012,00008,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "66,65000,-00023,-00007,00092,04477,-08432,03876,-00015,-00005,00045,-00008,-00002,00047,-00005,00011,-00005,-07232,-00129,06667,00008,-00027,00008,-07375,-00079,06290,00003,-00016,00003,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "67,66000,-00022,-00012,00091,06517,-07953,01612,-00015,-00007,00044,-00007,-00005,00047,-00011,00006,00019,-05544,-02620,07586,00017,-00025,-00021,-05722,-02658,07245,00006,-00019,-00002,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "68,67000,-00016,-00015,00078,07862,-06758,-00724,-00011,-00008,00038,-00005,-00007,00040,-00017,00005,00044,-03225,-05101,07765,00024,-00021,-00050,-03448,-05090,07415,00007,-00016,-00006,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "69,68000,-00009,-00013,00059,08394,-04849,-02986,-00007,-00008,00028,-00002,-00005,00031,-00021,00001,00068,-00627,-06993,07147,00029,-00009,-00077,-00884,-06945,06897,00008,-00008,-00009,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "70,69000,-00004,-00013,00034,08210,-02396,-05089,-00003,-00007,00015,-00001,-00006,00019,-00022,-00005,00085,01993,-08128,05841,00031,-00003,-00094,01768,-08110,05646,00009,-00008,-00009,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "71,70000,00000,-00009,00004,07216,00103,-06583,00000,-00005,00000,00000,-00004,00004,-00023,-00007,00092,04477,-08432,03876,00029,00006,-00106,04297,-08446,03837,00006,-00001,-00014,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "72,71000,00006,-00006,-00024,05566,02607,-07473,00004,-00003,-00014,00002,-00003,-00010,-00022,-00012,00091,06517,-07953,01612,00022,00015,-00103,06349,-07978,01713,00000,00003,-00012,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "73,72000,00010,-00002,-00050,03235,05068,-07715,00006,00000,-00027,00004,-00002,-00023,-00016,-00015,00078,07862,-06758,-00724,00013,00020,-00092,07777,-06779,-00513,-00003,00005,-00014,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "74,73000,00017,00002,-00074,00654,06986,-07126,00011,00002,-00039,00006,00000,-00035,-00009,-00013,00059,08394,-04849,-02986,00006,00024,-00072,08439,-04842,-02754,-00003,00011,-00013,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "75,74000,00018,00007,-00091,-01961,08138,-05817,00011,00006,-00048,00007,00001,-00043,-00004,-00013,00034,08210,-02396,-05089,-00005,00022,-00045,08325,-02444,-04707,-00009,00009,-00011,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "76,75000,00019,00013,-00099,-04467,08427,-03852,00012,00009,-00051,00007,00004,-00048,00000,-00009,00004,07216,00103,-06583,-00016,00020,-00012,07408,00071,-06190,-00016,00011,-00008,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "77,76000,00016,00015,-00097,-06498,07964,-01580,00010,00011,-00050,00006,00004,-00047,00006,-00006,-00024,05566,02607,-07473,-00025,00015,00022,05778,02646,-07136,-00019,00009,-00002,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "78,77000,00009,00017,-00085,-07835,06764,00736,00006,00012,-00043,00003,00005,-00042,00010,-00002,-00050,03235,05068,-07715,-00032,00011,00051,03487,05072,-07369,-00022,00009,00001,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "79,78000,00004,00017,-00067,-08364,04855,02999,00003,00011,-00034,00001,00006,-00033,00017,00002,-00074,00654,06986,-07126,-00036,-00003,00078,00951,06949,-06859,-00019,-00001,00004,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "80,79000,00000,00016,-00043,-08190,02412,05114,00000,00011,-00022,00000,00005,-00021,00018,00007,-00091,-01961,08138,-05817,-00036,-00007,00100,-01716,08113,-05633,-00018,00000,00009,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "81,80000,-00007,00013,-00013,-07205,-00093,06603,-00004,00008,-00007,-00003,00005,-00006,00019,00013,-00099,-04467,08427,-03852,-00036,-00016,00109,-04243,08457,-03809,-00017,-00003,00010,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "82,81000,-00012,00009,00009,-05549,-02582,07624,-00007,00005,00004,-00005,00004,00005,00016,00015,-00097,-06498,07964,-01580,-00032,-00025,00109,-06297,07995,-01694,-00016,-00010,00012,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "83,82000,-00012,00010,00016,-03286,-05087,08288,-00007,00006,00007,-00005,00004,00009,00009,00017,-00085,-07835,06764,00736,-00023,-00030,00098,-07714,06790,00526,-00014,-00013,00013,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "84,83000,-00016,00008,00027,-00750,-07054,07598,-00010,00004,00012,-00006,00004,00015,00004,00017,-00067,-08364,04855,02999,-00014,-00032,00076,-08378,04861,02769,-00010,-00015,00009,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "85,84000,-00015,00004,00035,01845,-08225,06118,-00010,00002,00017,-00005,00002,00018,00000,00016,-00043,-08190,02412,05114,-00003,-00032,00051,-08271,02464,04722,-00003,-00016,00008,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "86,85000,-00012,00000,00035,04486,-08372,04078,-00008,00000,00017,-00004,00000,00018,-00007,00013,-00013,-07205,-00093,06603,00008,-00027,00017,-07353,-00043,06223,00001,-00014,00004,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "87,86000,-00009,00000,00034,06370,-08049,01677,-00006,00000,00016,-00003,00000,00018,-00012,00009,00009,-05549,-02582,07624,00015,-00027,-00005,-05722,-02603,07529,00003,-00018,00004,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "88,87000,-00003,-00002,00027,07860,-06741,-00761,-00003,-00001,00012,00000,-00001,00015,-00012,00010,00016,-03286,-05087,08288,00020,-00025,-00023,-03450,-05012,08023,00008,-00015,-00007,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "89,88000,-00001,-00003,00016,08405,-04846,-03281,-00001,-00002,00007,00000,-00001,00009,-00016,00008,00027,-00750,-07054,07598,00020,-00016,-00036,-00978,-06979,07402,00004,-00008,-00009,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "90,89000,-00001,-00007,00005,08312,-02337,-05499,-00001,-00003,00001,00000,-00004,00004,-00015,00004,00035,01845,-08225,06118,00020,-00009,-00047,01715,-08090,06094,00005,-00005,-00012,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "91,90000,00001,-00010,-00006,07266,00140,-07067,00000,-00005,-00005,00001,-00005,-00001,-00012,00000,00035,04486,-08372,04078,00017,-00005,-00050,04251,-08440,04081,00005,-00005,-00015,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "92,91000,00006,-00006,-00014,05559,02604,-08071,00003,-00003,-00009,00003,-00003,-00005,-00009,00000,00034,06370,-08049,01677,00013,00004,-00047,06258,-08021,01811,00004,00004,-00013,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "93,92000,00008,-00006,-00013,03190,05019,-08572,00005,-00003,-00009,00003,-00003,-00004,-00003,-00002,00027,07860,-06741,-00761,00004,00008,-00043,07761,-06782,-00652,00001,00006,-00016,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "94,93000,00013,-00005,-00018,00876,07206,-07650,00007,-00002,-00011,00006,-00003,-00007,-00001,-00003,00016,08405,-04846,-03281,-00005,00015,-00032,08423,-04869,-03145,-00006,00012,-00016,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "95,94000,00009,-00002,-00019,-01966,08091,-06293,00005,00000,-00011,00004,-00002,-00008,-00001,-00007,00005,08312,-02337,-05499,-00012,00017,-00016,08375,-02424,-05262,-00013,00010,-00011,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "96,95000,00007,00000,-00019,-04431,08391,-04080,00004,00001,-00011,00003,-00001,-00008,00001,-00010,-00006,07266,00140,-07067,-00018,00020,-00003,07397,00035,-06880,-00017,00010,-00009,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "97,96000,00004,00002,-00017,-06343,08088,-01613,00002,00002,-00010,00002,00000,-00007,00006,-00006,-00014,05559,02604,-08071,-00023,00020,00008,05618,02475,-08174,-00017,00014,-00006,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "98,97000,00000,00004,-00013,-07757,06834,00837,00000,00003,-00008,00000,00001,-00005,00008,-00006,-00013,03190,05019,-08572,-00027,00017,00013,03381,04961,-08428,-00019,00011,00000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "99,98000,-00002,00005,-00008,-08400,04869,03422,-00002,00004,-00005,00000,00001,-00003,00013,-00005,-00018,00876,07206,-07650,-00030,00008,00020,01022,06997,-07657,-00017,00003,00002,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "100,99000,-00005,00008,-00007,-08236,02423,05833,-00003,00006,-00004,-00002,00002,-00003,00009,-00002,-00019,-01966,08091,-06293,-00027,00004,00026,-01858,07918,-06359,-00018,00002,00007,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "101,100000,-00011,00007,-00003,-07199,-00109,07309,-00007,00004,-00002,-00004,00003,-00001,00007,00000,-00019,-04431,08391,-04080,-00025,-00003,00029,-04143,08500,-04084,-00018,-00003,00010,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "102,101000,-00013,00007,00000,-05565,-02640,08199,-00008,00004,00000,-00005,00003,00000,00004,00002,-00017,-06343,08088,-01613,-00016,-00009,00029,-06241,08018,-01812,-00012,-00007,00012,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "103,102000,-00018,00007,00002,-03256,-05074,08440,-00011,00004,00000,-00007,00003,00002,00000,00004,-00013,-07757,06834,00837,-00009,-00016,00022,-07578,06944,00797,-00009,-00012,00009,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "104,103000,-00018,00006,00005,-00726,-07044,07769,-00011,00004,00001,-00007,00002,00004,-00002,00005,-00008,-08400,04869,03422,-00003,-00021,00020,-08363,04927,03389,-00005,-00016,00012,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "105,104000,-00017,00002,00007,01896,-08192,06317,-00010,00001,00003,-00007,00001,00004,-00005,00008,-00007,-08236,02423,05833,00006,-00025,00013,-08137,02632,05687,00001,-00017,00006,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "106,105000,-00018,00000,00007,04394,-08434,04139,-00011,00000,00003,-00007,00000,00004,-00011,00007,-00003,-07199,-00109,07309,00015,-00025,00002,-07268,00032,07204,00004,-00018,-00001,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "107,106000,-00013,-00001,00006,06413,-07986,01598,-00008,-00001,00002,-00005,00000,00004,-00013,00007,00000,-05565,-02640,08199,00020,-00025,-00003,-05585,-02488,08238,00007,-00018,-00003,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "108,107000,-00008,-00003,00002,07784,-06839,-00871,-00005,-00001,00000,-00003,-00002,00002,-00018,00007,00002,-03256,-05074,08440,00024,-00023,-00009,-03359,-04960,08387,00006,-00016,-00007,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "109,108000,-00003,-00005,-00002,08394,-04920,-03340,-00002,-00002,-00002,-00001,-00003,00000,-00018,00006,00005,-00726,-07044,07769,00026,-00016,-00014,-00857,-06863,07777,00008,-00010,-00009,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "110,109000,-00001,-00007,-00003,08208,-02439,-05766,-00001,-00003,-00003,00000,-00004,00000,-00017,00002,00007,01896,-08192,06317,00026,-00009,-00021,01765,-08062,06323,00009,-00007,-00014,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "111,110000,00003,-00006,-00009,07248,00159,-07351,00002,-00003,-00006,00001,-00003,-00003,-00018,00000,00007,04394,-08434,04139,00022,-00003,-00023,04254,-08406,04186,00004,-00003,-00016,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "112,111000,00007,-00004,-00014,05590,02658,-08214,00004,-00002,-00008,00003,-00002,-00006,-00013,-00001,00006,06413,-07986,01598,00015,00006,-00021,06248,-08026,01723,00002,00005,-00015,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "113,112000,00009,-00005,-00014,03239,05079,-08390,00005,-00002,-00009,00004,-00003,-00005,-00008,-00003,00002,07784,-06839,-00871,00006,00008,-00018,07681,-06888,-00757,-00002,00005,-00016,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "114,113000,00013,-00003,-00019,00710,07028,-07717,00007,-00001,-00011,00006,-00002,-00008,-00003,-00005,-00002,08394,-04920,-03340,-00003,00015,-00014,08336,-04999,-03365,-00006,00010,-00016,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "115,114000,00012,-00001,-00023,-01879,08195,-06313,00007,00000,-00013,00005,-00001,-00010,-00001,-00007,-00003,08208,-02439,-05766,-00012,00015,-00007,08205,-02594,-05638,-00013,00008,-00010,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "116,115000,00009,00002,-00021,-04373,08469,-04139,00005,00002,-00012,00004,00000,-00009,00003,-00006,-00009,07248,00159,-07351,-00016,00015,-00003,07299,-00027,-07257,-00013,00009,-00012,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "117,116000,00007,00002,-00019,-06418,08002,-01595,00004,00002,-00011,00003,00000,-00008,00007,-00004,-00014,05590,02658,-08214,-00025,00017,00011,05644,02530,-08214,-00018,00013,-00003,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "118,117000,00000,00004,-00014,-07788,06805,00935,00000,00004,-00008,00000,00000,-00006,00009,-00005,-00014,03239,05079,-08390,-00030,00015,00017,03369,04954,-08378,-00021,00010,00003,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "119,118000,00000,00006,-00012,-08383,04922,03391,00000,00005,-00007,00000,00001,-00005,00013,-00003,-00019,00710,07028,-07717,-00032,00008,00024,00888,06860,-07741,-00019,00005,00005,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "120,119000,-00001,00008,-00009,-08204,02469,05724,-00001,00006,-00005,00000,00002,-00004,00012,-00001,-00023,-01879,08195,-06313,-00032,-00003,00029,-01732,08061,-06327,-00020,-00004,00006,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "121,120000,-00009,00012,-00005,-07234,-00141,07369,-00005,00007,-00003,-00004,00005,-00002,00009,00002,-00021,-04373,08469,-04139,-00025,-00005,00031,-04207,08445,-04196,-00016,-00003,00010,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "122,121000,-00012,00009,00000,-05587,-02668,08288,-00008,00006,00000,-00004,00003,00000,00007,00002,-00019,-06418,08002,-01595,-00021,-00009,00031,-06227,08034,-01732,-00014,-00007,00012,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "123,122000,-00016,00008,00003,-03254,-05100,08405,-00010,00005,00001,-00006,00003,00002,00000,00004,-00014,-07788,06805,00935,-00012,-00016,00024,-07648,06872,00813,-00012,-00012,00010,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "124,123000,-00019,00006,00006,-00681,-06992,07708,-00012,00004,00002,-00007,00002,00004,00000,00006,-00012,-08383,04922,03391,-00005,-00023,00020,-08308,05005,03373,-00005,-00017,00008,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "125,124000,-00017,00002,00008,01906,-08159,06300,-00011,00001,00004,-00006,00001,00004,-00001,00008,-00009,-08204,02469,05724,00006,-00025,00015,-08165,02609,05610,00005,-00017,00006,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "126,125000,-00016,00000,00008,04356,-08466,04158,-00010,00000,00003,-00006,00000,00005,-00009,00012,-00005,-07234,-00141,07369,00013,-00023,00006,-07250,00044,07281,00004,-00011,00001,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "127,126000,-00014,00000,00007,06422,-08009,01642,-00009,00000,00002,-00005,00000,00005,-00012,00009,00000,-05587,-02668,08288,00020,-00025,-00003,-05615,-02535,08238,00008,-00016,-00003,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "128,127000,-00008,-00002,00003,07820,-06808,-00915,-00005,-00001,00000,-00003,-00001,00003,-00016,00008,00003,-03254,-05100,08405,00024,-00023,-00007,-03347,-04951,08379,00008,-00015,-00004,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "129,128000,-00004,-00003,00001,08407,-04911,-03414,-00002,-00001,00000,-00002,-00002,00001,-00019,00006,00006,-00681,-06992,07708,00024,-00016,-00016,-00825,-06827,07727,00005,-00010,-00010,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "130,129000,-00001,-00007,-00003,08225,-02447,-05718,-00001,-00003,-00003,00000,-00004,00000,-00017,00002,00008,01906,-08159,06300,00024,-00009,-00021,01770,-08039,06310,00007,-00007,-00013,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "131,130000,00002,-00008,-00004,07249,00141,-07348,00001,-00004,-00004,00001,-00004,00000,-00016,00000,00008,04356,-08466,04158,00020,-00003,-00025,04233,-08431,04195,00004,-00003,-00017,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "132,131000,00005,-00007,-00009,05600,02680,-08282,00003,-00003,-00006,00002,-00004,-00003,-00014,00000,00007,06422,-08009,01642,00017,00006,-00023,06274,-08028,01748,00003,00006,-00016,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "133,132000,00008,-00007,-00011,03267,05133,-08410,00005,-00003,-00007,00003,-00004,-00004,-00008,-00002,00003,07820,-06808,-00915,00006,00013,-00021,07704,-06866,-00829,-00002,00011,-00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "134,133000,00010,-00006,-00015,00689,07008,-07707,00006,-00002,-00009,00004,-00004,-00006,-00004,-00003,00001,08407,-04911,-03414,-00003,00015,-00016,08359,-04992,-03388,-00007,00012,-00015,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "135,134000,00009,-00002,-00017,-01890,08169,-06286,00006,00000,-00009,00003,-00002,-00008,-00001,-00007,-00003,08225,-02447,-05718,-00009,00020,-00012,08220,-02592,-05619,-00010,00013,-00015,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "136,135000,00008,00000,-00017,-04338,08474,-04148,00005,00000,-00010,00003,00000,-00007,00002,-00008,-00004,07249,00141,-07348,-00016,00020,-00003,07304,-00042,-07286,-00014,00012,-00007,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "137,136000,00007,00002,-00015,-06420,08023,-01643,00004,00002,-00010,00003,00000,-00005,00005,-00007,-00009,05600,02680,-08282,-00025,00020,00006,05660,02560,-08251,-00020,00013,-00003,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "138,137000,00001,00004,-00012,-07800,06826,00925,00001,00003,-00007,00000,00001,-00005,00008,-00007,-00011,03267,05133,-08410,-00027,00017,00013,03390,04977,-08399,-00019,00010,00002,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "139,138000,-00001,00006,-00008,-08402,04924,03423,-00001,00004,-00005,00000,00002,-00003,00010,-00006,-00015,00689,07008,-07707,-00027,00011,00017,00870,06849,-07742,-00017,00005,00002,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "140,139000,-00001,00008,-00007,-08230,02457,05742,-00001,00005,-00004,00000,00003,-00003,00009,-00002,-00017,-01890,08169,-06286,-00027,00004,00024,-01719,08055,-06318,-00018,00002,00007,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "141,140000,-00008,00009,-00002,-07246,-00128,07369,-00005,00005,-00001,-00003,00004,-00001,00008,00000,-00017,-04338,08474,-04148,-00025,-00003,00029,-04196,08448,-04209,-00017,-00003,00012,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "142,141000,-00014,00007,00000,-05589,-02663,08289,-00008,00004,00000,-00006,00003,00000,00007,00002,-00015,-06420,08023,-01643,-00021,-00009,00026,-06233,08047,-01760,-00014,-00007,00011,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "143,142000,-00017,00008,00002,-03271,-05113,08425,-00011,00005,00000,-00006,00003,00002,00001,00004,-00012,-07800,06826,00925,-00012,-00014,00022,-07662,06888,00817,-00011,-00010,00010,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "144,143000,-00016,00008,00005,-00694,-07010,07739,-00010,00006,00001,-00006,00002,00004,-00001,00006,-00008,-08402,04924,03423,-00005,-00021,00020,-08328,05007,03383,-00006,-00015,00012,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "145,144000,-00016,00001,00006,01888,-08169,06324,-00010,00001,00002,-00006,00000,00004,-00001,00008,-00007,-08230,02457,05742,00006,-00023,00013,-08192,02605,05625,00005,-00015,00006,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "146,145000,-00016,00000,00008,04346,-08478,04172,-00010,00000,00004,-00006,00000,00004,-00008,00009,-00002,-07246,-00128,07369,00013,-00025,00004,-07268,00055,07285,00005,-00016,00002,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "147,146000,-00013,00000,00006,06421,-08023,01664,-00008,00000,00002,-00005,00000,00004,-00014,00007,00000,-05589,-02663,08289,00020,-00023,-00003,-05628,-02542,08248,00006,-00016,-00003,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "148,147000,-00007,00000,00003,07812,-06823,-00903,-00005,00000,00000,-00002,00000,00003,-00017,00008,00002,-03271,-05113,08425,00024,-00021,-00009,-03366,-04964,08400,00007,-00013,-00007,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "149,148000,-00002,-00004,00001,08407,-04931,-03392,-00002,-00002,00000,00000,-00002,00001,-00016,00008,00005,-00694,-07010,07739,00024,-00016,-00016,-00841,-06852,07757,00008,-00008,-00011,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "150,149000,00000,-00005,-00002,08242,-02463,-05716,00000,-00003,-00002,00000,-00002,00000,-00016,00001,00006,01888,-08169,06324,00022,-00009,-00021,01747,-08053,06330,00006,-00008,-00015,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "151,150000,00002,-00008,-00006,07264,00126,-07356,00001,-00005,-00004,00001,-00003,-00002,-00016,00000,00008,04346,-08478,04172,00020,-00003,-00023,04226,-08449,04222,00004,-00003,-00015,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "152,151000,00007,-00006,-00011,05604,02674,-08279,00004,-00003,-00007,00003,-00003,-00004,-00013,00000,00006,06421,-08023,01664,00015,00002,-00021,06264,-08044,01766,00002,00002,-00015,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "153,152000,00011,-00005,-00013,03272,05119,-08406,00006,-00002,-00009,00005,-00003,-00004,-00007,00000,00003,07812,-06823,-00903,00006,00008,-00018,07699,-06889,-00807,-00001,00008,-00015,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "154,153000,00012,-00004,-00015,00703,07006,-07718,00008,-00001,-00009,00004,-00003,-00006,-00002,-00004,00001,08407,-04931,-03392,-00003,00013,-00014,08361,-05012,-03374,-00005,00009,-00013,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "155,154000,00010,-00002,-00018,-01872,08174,-06308,00006,00000,-00011,00004,-00002,-00007,00000,-00005,-00002,08242,-02463,-05716,-00009,00017,-00009,08232,-02610,-05620,-00009,00012,-00011,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "156,155000,00010,00001,-00017,-04332,08486,-04169,00005,00001,-00010,00005,00000,-00007,00002,-00008,-00006,07264,00126,-07356,-00018,00017,-00003,07308,-00052,-07287,-00016,00009,-00009,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "157,156000,00008,00001,-00017,-06411,08032,-01656,00005,00001,-00010,00003,00000,-00007,00007,-00006,-00011,05604,02674,-08279,-00025,00017,00006,05664,02546,-08249,-00018,00011,-00005,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "158,157000,00001,00005,-00012,-07797,06833,00912,00000,00004,-00007,00001,00001,-00005,00011,-00005,-00013,03272,05119,-08406,-00030,00015,00013,03394,04972,-08397,-00019,00010,00000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "159,158000,-00001,00006,-00008,-08398,04944,03401,-00001,00004,-00005,00000,00002,-00003,00012,-00004,-00015,00703,07006,-07718,-00030,00008,00020,00885,06851,-07757,-00018,00004,00005,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "160,159000,-00003,00009,-00006,-08236,02484,05722,-00002,00006,-00003,-00001,00003,-00003,00010,-00002,-00018,-01872,08174,-06308,-00030,00004,00024,-01712,08063,-06331,-00020,00002,00006,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "161,199000,00018,00009,00016,08413,08493,08428,00011,00005,00010,00007,00005,00007,00018,00010,00016,08413,08493,08428,00030,00025,00026,08370,08462,08408,00020,00018,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "162,239000,00017,00009,00015,08418,08498,08432,00011,00006,00009,00007,00004,00006,00017,00009,00015,08418,08498,08432,00030,00025,00026,08370,08466,08419,00021,00018,00019,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "163,279000,00017,00009,00015,08415,08504,08438,00011,00005,00009,00007,00005,00007,00017,00009,00015,08415,08504,08438,00030,00025,00025,08368,08471,08431,00021,00018,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "164,319000,00018,00009,00016,08414,08504,08443,00010,00006,00010,00008,00004,00007,00018,00009,00016,08414,08504,08443,00030,00025,00027,08368,08471,08435,00020,00018,00019,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "165,359000,00018,00009,00016,08413,08506,08446,00011,00006,00010,00008,00004,00007,00018,00009,00016,08413,08506,08446,00030,00025,00025,08364,08473,08435,00021,00017,00019,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "166,399000,00017,00010,00016,08408,08507,08452,00011,00006,00010,00007,00005,00006,00017,00009,00016,08408,08507,08452,00030,00025,00027,08362,08475,08440,00021,00018,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "167,439000,00017,00010,00016,08408,08509,08457,00010,00006,00009,00007,00005,00007,00017,00010,00016,08408,08509,08457,00030,00025,00025,08359,08473,08438,00021,00017,00017,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "168,479000,00019,00009,00016,08405,08509,08461,00012,00006,00010,00007,00004,00007,00019,00010,00016,08405,08509,08461,00030,00025,00026,08357,08473,08438,00021,00017,00017,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "169,519000,00017,00009,00016,08402,08508,08463,00011,00006,00010,00007,00005,00007,00017,00009,00016,08402,08508,08463,00032,00025,00025,08350,08471,08439,00023,00019,00016,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "170,559000,00018,00010,00015,08400,08508,08468,00011,00006,00010,00008,00004,00006,00018,00010,00015,08400,08508,08468,00030,00025,00027,08348,08471,08440,00021,00017,00017,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "171,599000,00017,00010,00016,08397,08509,08470,00010,00006,00009,00007,00005,00007,00017,00010,00016,08397,08509,08470,00030,00025,00027,08346,08473,08442,00021,00018,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "172,639000,00020,00009,00017,08394,08508,08471,00012,00006,00010,00008,00005,00007,00020,00010,00017,08394,08508,08471,00032,00025,00027,08339,08471,08446,00021,00018,00019,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "173,679000,00019,00009,00016,08388,08506,08472,00012,00006,00010,00007,00003,00007,00019,00009,00016,08388,08506,08472,00032,00025,00026,08336,08468,08449,00022,00019,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "174,719000,00018,00010,00016,08386,08504,08473,00011,00006,00010,00007,00004,00007,00018,00010,00016,08386,08504,08473,00032,00025,00025,08334,08468,08451,00022,00017,00017,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "175,759000,00018,00009,00015,08379,08503,08472,00011,00006,00009,00007,00004,00006,00018,00009,00015,08379,08503,08472,00030,00025,00027,08330,08468,08453,00020,00018,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "176,799000,00019,00010,00016,08378,08502,08474,00012,00006,00010,00007,00004,00007,00019,00010,00016,08378,08502,08474,00030,00025,00026,08332,08468,08454,00021,00019,00017,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "177,839000,00019,00009,00016,08375,08501,08472,00012,00006,00009,00007,00004,00007,00019,00009,00016,08375,08501,08472,00030,00025,00027,08337,08466,08454,00019,00019,00017,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "178,879000,00018,00009,00016,08372,08500,08473,00011,00006,00010,00007,00004,00007,00018,00009,00016,08372,08500,08473,00030,00025,00029,08339,08466,08454,00021,00019,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "179,919000,00017,00009,00017,08374,08501,08474,00011,00006,00010,00007,00004,00007,00017,00008,00017,08374,08501,08474,00030,00025,00025,08343,08466,08454,00020,00017,00017,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "180,959000,00018,00008,00015,08379,08500,08472,00011,00006,00009,00008,00004,00007,00018,00009,00015,08379,08500,08472,00030,00025,00027,08348,08464,08453,00020,00018,00017,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "181,999000,00018,00009,00015,08382,08497,08473,00011,00006,00009,00007,00003,00007,00018,00009,00015,08382,08497,08473,00030,00025,00025,08350,08461,08453,00021,00018,00017,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "182,1039000,00018,00009,00016,08384,08498,08473,00011,00005,00010,00007,00004,00007,00018,00009,00016,08384,08498,08473,00030,00025,00027,08352,08459,08451,00021,00017,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "183,1079000,00017,00010,00016,08387,08496,08474,00011,00006,00009,00007,00004,00007,00017,00010,00016,08387,08496,08474,00032,00025,00027,08357,08455,08453,00022,00019,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "184,1119000,00018,00010,00016,08387,08494,08473,00011,00006,00010,00007,00004,00007,00018,00009,00016,08387,08494,08473,00030,00025,00027,08357,08455,08453,00021,00018,00016,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "185,1159000,00019,00009,00016,08389,08492,08471,00011,00005,00010,00008,00004,00007,00019,00010,00016,08389,08492,08471,00030,00025,00027,08361,08452,08454,00020,00019,00019,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "186,1199000,00029,00027,00112,08389,08587,08470,00017,00017,00057,00012,00010,00055,00029,00022,00112,08389,08587,08470,00047,00032,00118,08359,08450,08454,00021,00017,00019,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "187,1239000,00028,00021,00095,08350,08417,07849,00018,00014,00049,00011,00008,00047,00028,00027,00101,08350,08417,07849,00038,00036,00110,08459,08470,07476,00021,00016,00021,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "188,1279000,00021,00022,00041,08395,08393,08566,00013,00013,00022,00009,00010,00021,00021,00022,00080,08349,08393,08566,00032,00034,00087,08387,08396,08472,00020,00017,00021,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "189,1319000,00018,00017,00020,08404,08404,08443,00011,00011,00011,00007,00007,00009,00019,00017,00020,08404,08404,08443,00030,00032,00032,08370,08368,08442,00021,00018,00019,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "190,1359000,00017,00015,00017,08417,08416,08443,00010,00009,00010,00007,00006,00007,00017,00015,00017,08417,08416,08443,00030,00030,00027,08384,08375,08440,00020,00016,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "191,1399000,00017,00014,00015,08423,08422,08451,00011,00008,00009,00007,00007,00008,00016,00012,00015,08423,08422,08451,00030,00027,00027,08387,08380,08442,00020,00018,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "192,1439000,00018,00012,00017,08430,08419,08453,00011,00008,00010,00007,00006,00007,00018,00014,00017,08430,08419,08453,00027,00027,00027,08395,08377,08445,00021,00018,00017,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "193,1479000,00017,00013,00016,08433,08416,08454,00010,00009,00010,00007,00006,00007,00017,00013,00016,08433,08416,08454,00027,00027,00025,08398,08375,08444,00020,00018,00017,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "194,1519000,00017,00013,00017,08439,08414,08454,00011,00009,00010,00007,00006,00007,00017,00013,00017,08439,08414,08454,00027,00030,00025,08402,08368,08445,00021,00018,00019,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "195,1559000,00017,00013,00018,08444,08411,08453,00011,00009,00011,00007,00006,00007,00017,00013,00018,08444,08411,08453,00027,00027,00027,08404,08361,08439,00021,00016,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "196,1599000,00017,00014,00016,08446,08404,08454,00011,00008,00009,00006,00006,00007,00017,00013,00016,08446,08404,08454,00030,00027,00027,08405,08357,08443,00022,00017,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "197,1639000,00016,00013,00016,08450,08403,08452,00011,00008,00010,00007,00005,00007,00016,00014,00016,08450,08403,08452,00027,00027,00027,08411,08350,08444,00020,00019,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "198,1679000,00018,00014,00016,08450,08398,08450,00010,00008,00010,00008,00006,00007,00018,00013,00016,08450,08398,08450,00030,00030,00027,08412,08346,08446,00020,00017,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "199,1719000,00017,00014,00017,08453,08395,08448,00010,00009,00010,00007,00006,00007,00017,00014,00017,08453,08395,08448,00030,00027,00027,08414,08345,08442,00021,00014,00019,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "200,1759000,00017,00013,00017,08453,08389,08447,00011,00008,00011,00006,00006,00006,00017,00014,00017,08453,08389,08447,00030,00027,00027,08414,08350,08446,00022,00016,00019,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "201,1799000,00017,00014,00017,08456,08387,08445,00011,00008,00011,00006,00006,00007,00017,00014,00017,08456,08387,08445,00030,00027,00026,08416,08354,08442,00020,00016,00017,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "202,1839000,00018,00014,00017,08458,08385,08444,00010,00009,00010,00008,00006,00008,00018,00014,00017,08458,08385,08444,00030,00027,00026,08421,08361,08440,00020,00016,00016,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "203,1879000,00017,00014,00016,08462,08385,08443,00011,00008,00010,00006,00006,00007,00017,00014,00016,08462,08385,08443,00030,00027,00027,08420,08362,08438,00021,00016,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "204,1919000,00019,00013,00018,08462,08390,08445,00011,00009,00011,00008,00007,00008,00019,00013,00018,08462,08390,08445,00030,00027,00027,08423,08366,08435,00019,00015,00019,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "205,1959000,00018,00014,00016,08466,08395,08445,00011,00009,00010,00007,00006,00007,00018,00013,00016,08466,08395,08445,00030,00030,00027,08421,08370,08435,00020,00017,00017,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "206,1999000,00017,00014,00016,08468,08396,08448,00011,00008,00010,00006,00006,00008,00017,00014,00016,08468,08396,08448,00030,00027,00027,08423,08371,08432,00021,00015,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "207,2039000,00016,00014,00016,08468,08401,08447,00010,00008,00009,00006,00006,00007,00016,00013,00016,08468,08401,08447,00027,00027,00027,08421,08375,08433,00021,00016,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "208,2079000,00016,00013,00016,08470,08406,08448,00011,00008,00010,00006,00005,00006,00016,00014,00016,08470,08406,08448,00030,00027,00027,08425,08377,08433,00022,00015,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "209,2119000,00016,00014,00016,08471,08408,08447,00010,00008,00010,00006,00006,00007,00016,00014,00016,08471,08408,08447,00027,00027,00027,08425,08380,08435,00020,00016,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "210,2159000,00016,00013,00016,08472,08412,08447,00010,00008,00010,00006,00006,00006,00016,00013,00016,08472,08412,08447,00027,00027,00027,08425,08384,08433,00019,00016,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "211,2199000,00017,00013,00016,08472,08414,08444,00011,00009,00011,00006,00006,00006,00017,00013,00016,08472,08414,08444,00027,00027,00027,08425,08386,08433,00019,00018,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "212,2239000,00018,00013,00016,08472,08418,08443,00010,00008,00010,00008,00006,00007,00018,00013,00016,08472,08418,08443,00027,00027,00027,08427,08389,08431,00020,00017,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "213,2279000,00017,00014,00017,08473,08421,08441,00010,00008,00010,00007,00007,00008,00017,00014,00017,08473,08421,08441,00030,00027,00027,08427,08391,08429,00020,00015,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "214,2319000,00018,00013,00016,08475,08422,08438,00011,00008,00010,00007,00006,00007,00018,00013,00016,08475,08422,08438,00027,00027,00026,08428,08395,08426,00021,00017,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "215,2359000,00016,00012,00016,08477,08426,08436,00010,00008,00010,00006,00006,00007,00016,00012,00016,08477,08426,08436,00027,00027,00025,08425,08396,08422,00019,00016,00020,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "216,2399000,00016,00012,00016,08477,08427,08432,00011,00008,00009,00006,00006,00007,00016,00012,00016,08477,08427,08432,00027,00030,00025,08425,08400,08419,00019,00018,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "217,2439000,00016,00013,00015,08476,08429,08431,00010,00008,00010,00006,00006,00006,00016,00013,00015,08476,08429,08431,00027,00027,00027,08425,08402,08413,00020,00016,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "218,2479000,00016,00012,00015,08474,08432,08426,00009,00008,00009,00007,00006,00006,00016,00012,00015,08474,08432,08426,00027,00027,00025,08423,08404,08410,00020,00016,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "219,2519000,00018,00013,00016,08473,08434,08422,00011,00009,00010,00007,00006,00007,00018,00013,00016,08473,08434,08422,00027,00027,00025,08421,08405,08406,00019,00015,00017,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "220,2559000,00016,00013,00017,08471,08437,08419,00010,00008,00009,00007,00006,00008,00016,00013,00017,08471,08437,08419,00030,00027,00025,08420,08409,08401,00020,00017,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "221,2599000,00016,00013,00017,08472,08440,08416,00010,00008,00009,00006,00007,00008,00016,00013,00017,08472,08440,08416,00027,00027,00027,08420,08412,08397,00020,00015,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "222,2639000,00016,00013,00016,08466,08442,08408,00011,00008,00010,00006,00006,00006,00016,00013,00016,08466,08442,08408,00027,00027,00025,08420,08414,08396,00020,00016,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "223,2679000,00016,00013,00016,08462,08443,08402,00011,00009,00010,00006,00006,00007,00016,00012,00016,08462,08443,08402,00027,00027,00026,08416,08416,08390,00020,00016,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "224,2719000,00017,00013,00015,08461,08446,08395,00011,00008,00009,00006,00006,00006,00017,00013,00015,08461,08446,08395,00027,00030,00025,08416,08420,08387,00020,00019,00019,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "225,2759000,00018,00013,00017,08460,08448,08390,00011,00008,00010,00007,00006,00008,00018,00013,00017,08460,08448,08390,00027,00027,00027,08414,08420,08381,00020,00017,00017,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "226,2799000,00016,00013,00015,08458,08448,08385,00011,00008,00009,00006,00005,00006,00016,00013,00015,08458,08448,08385,00027,00030,00026,08416,08421,08376,00019,00018,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "227,2839000,00017,00013,00016,08456,08450,08374,00011,00009,00010,00006,00006,00007,00017,00013,00016,08456,08450,08374,00027,00027,00027,08412,08425,08371,00020,00016,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "228,2879000,00017,00013,00017,08454,08454,08370,00011,00009,00011,00007,00005,00007,00017,00013,00017,08454,08454,08370,00027,00030,00027,08412,08427,08362,00021,00018,00017,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "229,2919000,00018,00013,00017,08453,08455,08365,00011,00008,00009,00007,00006,00008,00018,00013,00017,08453,08455,08365,00027,00027,00025,08409,08428,08362,00021,00016,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "230,2959000,00017,00014,00016,08452,08456,08363,00011,00009,00010,00006,00007,00007,00017,00014,00016,08452,08456,08363,00030,00027,00027,08409,08428,08355,00020,00016,00017,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "231,2999000,00017,00014,00016,08449,08456,08369,00010,00009,00010,00007,00006,00007,00017,00014,00016,08449,08456,08369,00030,00030,00027,08404,08430,08351,00019,00016,00017,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "232,3039000,00017,00013,00016,08449,08460,08377,00010,00009,00010,00007,00006,00007,00017,00013,00016,08449,08460,08377,00030,00027,00026,08402,08432,08355,00022,00015,00017,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "233,3079000,00017,00014,00017,08446,08460,08379,00011,00009,00010,00006,00006,00007,00017,00013,00017,08446,08460,08379,00030,00030,00027,08402,08432,08362,00020,00018,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "234,3119000,00017,00014,00016,08445,08459,08384,00011,00009,00010,00007,00006,00007,00017,00014,00016,08445,08459,08384,00030,00027,00026,08402,08432,08363,00020,00018,00017,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "235,3159000,00016,00013,00015,08445,08462,08387,00011,00008,00009,00007,00006,00007,00016,00013,00015,08445,08462,08387,00027,00027,00027,08400,08436,08372,00020,00017,00019,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "236,3199000,00018,00013,00016,08445,08463,08389,00011,00009,00010,00007,00006,00006,00018,00013,00016,08445,08463,08389,00027,00027,00027,08398,08436,08376,00020,00017,00020,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "237,3239000,00017,00013,00016,08445,08463,08390,00011,00009,00010,00008,00006,00007,00017,00013,00016,08445,08463,08390,00027,00027,00029,08398,08436,08376,00020,00017,00019,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "238,3279000,00015,00013,00016,08445,08464,08395,00010,00008,00010,00006,00006,00007,00016,00013,00016,08445,08464,08395,00030,00027,00025,08395,08437,08380,00020,00017,00017,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "239,3319000,00017,00013,00016,08446,08468,08398,00011,00008,00010,00007,00006,00007,00017,00013,00016,08446,08468,08398,00032,00030,00027,08393,08441,08385,00023,00018,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "240,3359000,00018,00013,00016,08445,08467,08401,00011,00008,00010,00007,00007,00007,00018,00013,00016,08445,08467,08401,00030,00030,00027,08393,08441,08387,00021,00018,00019,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "241,3399000,00016,00014,00016,08443,08466,08406,00010,00009,00010,00006,00006,00007,00016,00013,00016,08443,08466,08406,00030,00030,00027,08391,08439,08388,00022,00018,00019,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "242,3439000,00017,00014,00015,08443,08466,08409,00010,00009,00009,00007,00006,00006,00017,00014,00015,08443,08466,08409,00027,00027,00027,08386,08439,08392,00021,00019,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "243,3479000,00016,00013,00017,08438,08468,08416,00010,00009,00010,00007,00006,00007,00016,00013,00017,08438,08468,08416,00030,00027,00027,08384,08441,08397,00021,00018,00019,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "244,3519000,00018,00014,00017,08436,08469,08420,00011,00009,00010,00007,00006,00007,00018,00014,00017,08436,08469,08420,00027,00027,00027,08384,08441,08403,00019,00018,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "245,3559000,00017,00014,00015,08433,08468,08423,00011,00009,00010,00007,00006,00006,00017,00013,00015,08433,08468,08423,00030,00027,00027,08380,08439,08403,00023,00017,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "246,3599000,00016,00013,00016,08432,08468,08426,00011,00009,00010,00007,00006,00006,00016,00014,00016,08432,08468,08426,00030,00030,00027,08379,08443,08408,00020,00018,00019,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "247,3639000,00017,00014,00016,08431,08469,08426,00010,00009,00010,00007,00006,00007,00017,00014,00016,08431,08469,08426,00027,00027,00026,08375,08441,08412,00019,00017,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "248,3679000,00016,00013,00017,08426,08469,08428,00010,00008,00010,00006,00007,00007,00016,00013,00017,08426,08469,08428,00030,00027,00025,08371,08443,08415,00021,00017,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "249,3719000,00015,00013,00016,08425,08470,08429,00009,00009,00010,00006,00006,00006,00015,00013,00016,08425,08470,08429,00030,00027,00025,08370,08439,08415,00020,00016,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "250,3759000,00016,00013,00017,08424,08468,08430,00010,00008,00010,00006,00007,00007,00016,00013,00017,08424,08468,08430,00027,00030,00026,08364,08439,08417,00020,00018,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "251,3799000,00016,00013,00016,08421,08467,08429,00010,00009,00010,00006,00006,00007,00016,00013,00016,08421,08467,08429,00027,00027,00025,08361,08436,08419,00019,00017,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "252,3839000,00016,00012,00016,08419,08465,08435,00011,00008,00009,00006,00006,00007,00016,00013,00016,08419,08465,08435,00027,00032,00025,08359,08436,08419,00020,00020,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "253,3879000,00016,00014,00016,08416,08465,08438,00011,00008,00010,00006,00006,00006,00016,00013,00016,08416,08465,08438,00027,00030,00027,08355,08436,08422,00020,00018,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "254,3919000,00016,00014,00016,08413,08464,08441,00010,00009,00010,00006,00006,00006,00016,00014,00016,08413,08464,08441,00027,00027,00025,08352,08434,08422,00022,00016,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "255,3959000,00017,00014,00016,08407,08464,08443,00010,00009,00010,00007,00006,00007,00017,00014,00016,08407,08464,08443,00030,00027,00025,08346,08434,08426,00022,00016,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "256,3999000,00016,00013,00016,08404,08463,08448,00011,00008,00010,00006,00006,00007,00016,00014,00016,08404,08463,08448,00027,00030,00027,08341,08432,08428,00020,00018,00017,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "257,4039000,00016,00013,00017,08401,08460,08451,00011,00009,00010,00006,00006,00007,00016,00013,00017,08401,08460,08451,00030,00027,00027,08337,08430,08431,00020,00018,00019,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "258,4079000,00017,00013,00016,08396,08459,08452,00010,00008,00010,00007,00006,00007,00017,00013,00017,08396,08459,08452,00030,00027,00027,08334,08428,08431,00021,00016,00020,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "259,4119000,00017,00013,00016,08390,08459,08454,00011,00008,00010,00007,00006,00007,00017,00013,00016,08390,08459,08454,00027,00027,00025,08330,08430,08433,00020,00018,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "260,4159000,00018,00013,00016,08387,08456,08456,00011,00008,00010,00007,00006,00007,00018,00013,00016,08387,08456,08456,00027,00027,00025,08332,08427,08437,00021,00016,00017,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "261,4199000,00017,00013,00016,08383,08456,08457,00010,00008,00010,00007,00006,00006,00017,00013,00016,08383,08456,08457,00027,00027,00027,08337,08427,08437,00020,00017,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "262,4239000,00017,00013,00016,08380,08454,08457,00010,00008,00010,00007,00005,00007,00017,00013,00016,08380,08454,08457,00027,00027,00027,08341,08427,08437,00020,00018,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "263,4279000,00017,00014,00015,08380,08452,08456,00010,00008,00010,00007,00006,00006,00017,00014,00015,08380,08452,08456,00030,00027,00025,08346,08423,08438,00021,00017,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "264,4319000,00016,00014,00016,08385,08453,08455,00010,00008,00010,00006,00006,00007,00016,00012,00016,08385,08453,08455,00030,00027,00027,08348,08420,08440,00020,00018,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "265,4359000,00017,00014,00016,08390,08451,08459,00010,00008,00010,00007,00006,00007,00017,00014,00016,08390,08451,08459,00027,00030,00025,08352,08420,08442,00020,00017,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "266,4399000,00017,00014,00016,08392,08450,08462,00010,00008,00010,00007,00006,00007,00017,00014,00016,08392,08450,08462,00027,00030,00027,08355,08418,08442,00020,00017,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "267,4439000,00017,00012,00016,08396,08447,08463,00010,00008,00010,00007,00005,00007,00017,00014,00016,08396,08447,08463,00027,00030,00026,08359,08416,08444,00021,00018,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "268,4479000,00018,00014,00015,08399,08444,08463,00010,00008,00010,00008,00006,00007,00018,00013,00015,08399,08444,08463,00027,00027,00026,08362,08414,08446,00020,00018,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "269,4519000,00017,00013,00015,08403,08443,08465,00010,00008,00010,00007,00006,00007,00017,00014,00015,08403,08443,08465,00027,00027,00029,08370,08411,08444,00020,00017,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "270,4559000,00018,00013,00016,08405,08442,08465,00011,00009,00010,00007,00006,00007,00018,00013,00016,08405,08442,08465,00027,00030,00027,08370,08409,08446,00021,00018,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "271,4599000,00017,00015,00015,08408,08440,08465,00010,00008,00010,00007,00007,00007,00017,00015,00016,08408,08440,08465,00027,00030,00027,08373,08407,08447,00020,00017,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "272,4639000,00016,00014,00016,08413,08439,08464,00010,00008,00010,00006,00006,00007,00016,00014,00016,08413,08439,08464,00030,00030,00027,08377,08405,08447,00021,00017,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "273,4679000,00017,00014,00017,08416,08438,08463,00011,00008,00009,00007,00006,00008,00017,00014,00017,08416,08438,08463,00027,00027,00027,08379,08402,08447,00021,00017,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "274,4719000,00018,00014,00017,08419,08436,08462,00011,00008,00010,00008,00006,00007,00018,00014,00017,08419,08436,08462,00030,00030,00027,08382,08402,08447,00020,00018,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "275,4759000,00018,00014,00017,08421,08435,08461,00011,00008,00011,00007,00006,00007,00018,00014,00017,08421,08435,08461,00030,00030,00027,08384,08398,08447,00021,00018,00017,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "276,4799000,00017,00014,00016,08421,08431,08459,00010,00008,00010,00007,00006,00006,00017,00014,00016,08421,08431,08459,00027,00027,00026,08386,08393,08446,00021,00017,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "277,4839000,00016,00013,00016,08425,08430,08457,00010,00009,00010,00006,00006,00007,00016,00013,00016,08425,08430,08457,00030,00027,00026,08387,08393,08447,00022,00018,00017,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "278,4879000,00018,00014,00015,08428,08429,08457,00011,00008,00009,00007,00006,00006,00018,00014,00015,08428,08429,08457,00030,00030,00027,08393,08391,08449,00021,00018,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "279,4919000,00017,00013,00016,08430,08427,08459,00010,00008,00010,00007,00006,00007,00017,00013,00016,08430,08427,08459,00027,00030,00025,08395,08386,08447,00021,00018,00019,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "280,4959000,00017,00014,00015,08432,08426,08460,00010,00009,00009,00007,00006,00007,00017,00014,00016,08432,08426,08460,00027,00030,00027,08396,08384,08451,00020,00018,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "281,4999000,00017,00014,00018,08434,08424,08458,00010,00008,00011,00007,00006,00007,00017,00013,00018,08434,08424,08458,00027,00030,00027,08398,08382,08449,00020,00018,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "282,5039000,00017,00014,00016,08434,08420,08459,00010,00008,00010,00007,00006,00007,00017,00014,00016,08434,08420,08459,00030,00030,00026,08400,08379,08447,00020,00016,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "283,5079000,00017,00013,00016,08434,08420,08460,00010,00008,00009,00007,00006,00007,00017,00013,00016,08434,08420,08460,00027,00027,00027,08402,08379,08449,00021,00017,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "284,5119000,00017,00014,00016,08435,08417,08459,00011,00008,00010,00006,00006,00007,00017,00013,00016,08435,08417,08459,00030,00027,00027,08404,08375,08449,00021,00016,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "285,5159000,00016,00014,00015,08436,08414,08459,00010,00008,00009,00007,00006,00006,00016,00014,00016,08436,08414,08459,00027,00027,00027,08405,08371,08449,00021,00015,00019,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "286,5199000,00016,00014,00016,08440,08412,08458,00010,00008,00010,00006,00006,00007,00016,00014,00016,08440,08412,08458,00030,00027,00027,08407,08370,08447,00022,00017,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "287,5239000,00017,00014,00016,08440,08411,08457,00010,00009,00010,00007,00006,00007,00017,00014,00016,08440,08411,08457,00030,00027,00029,08409,08366,08447,00022,00018,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "288,5279000,00016,00013,00016,08442,08409,08456,00010,00008,00009,00006,00006,00007,00016,00013,00016,08442,08409,08456,00027,00027,00027,08409,08364,08446,00021,00017,00019,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "289,5319000,00017,00014,00016,08444,08406,08455,00010,00008,00010,00007,00006,00007,00017,00013,00016,08444,08406,08455,00027,00027,00027,08411,08361,08446,00019,00018,00019,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "290,5359000,00017,00012,00018,08446,08404,08452,00011,00008,00011,00007,00006,00007,00017,00014,00017,08446,08404,08452,00027,00030,00026,08411,08357,08444,00021,00018,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "291,5399000,00017,00013,00016,08449,08403,08452,00011,00008,00010,00007,00006,00007,00017,00013,00018,08449,08403,08452,00027,00030,00027,08414,08354,08444,00020,00017,00019,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "292,5439000,00016,00015,00016,08451,08402,08451,00010,00009,00009,00007,00006,00007,00016,00015,00016,08451,08402,08451,00027,00027,00027,08414,08352,08446,00020,00018,00017,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "293,5479000,00017,00014,00015,08453,08400,08451,00011,00008,00009,00007,00006,00006,00017,00013,00016,08453,08400,08451,00030,00027,00025,08416,08348,08442,00021,00018,00019,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "294,5519000,00018,00013,00017,08455,08396,08449,00011,00008,00011,00007,00006,00007,00018,00014,00017,08455,08396,08449,00027,00030,00027,08416,08346,08444,00021,00018,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "295,5559000,00017,00014,00016,08458,08395,08450,00010,00008,00009,00007,00006,00007,00017,00013,00017,08458,08395,08450,00027,00027,00027,08418,08348,08444,00019,00017,00019,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "296,5599000,00017,00014,00017,08457,08393,08450,00011,00008,00011,00007,00006,00006,00017,00014,00017,08457,08393,08450,00027,00027,00027,08420,08352,08440,00021,00017,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "297,5639000,00017,00013,00016,08458,08390,08449,00010,00008,00009,00007,00006,00007,00017,00013,00017,08458,08390,08449,00027,00027,00027,08418,08355,08440,00020,00017,00019,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "298,5679000,00016,00013,00015,08460,08389,08449,00010,00008,00009,00007,00006,00006,00016,00013,00016,08460,08389,08449,00027,00027,00026,08420,08359,08438,00019,00015,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "299,5719000,00017,00012,00017,08461,08383,08449,00010,00008,00009,00007,00006,00008,00017,00012,00015,08461,08383,08449,00027,00030,00026,08420,08361,08437,00022,00018,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "300,5759000,00018,00013,00016,08462,08386,08447,00011,00008,00009,00007,00006,00007,00018,00013,00017,08462,08383,08447,00030,00027,00027,08421,08364,08437,00019,00017,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "301,5799000,00018,00013,00016,08464,08388,08448,00010,00009,00009,00008,00006,00007,00018,00013,00016,08464,08388,08448,00030,00030,00026,08421,08366,08435,00022,00018,00019,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "302,5839000,00017,00014,00015,08464,08392,08447,00011,00009,00009,00007,00006,00006,00017,00014,00016,08464,08389,08447,00030,00027,00027,08421,08368,08435,00020,00016,00019,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "303,5879000,00017,00012,00016,08465,08395,08446,00010,00009,00010,00007,00006,00006,00017,00012,00016,08465,08393,08446,00027,00027,00025,08421,08371,08431,00022,00018,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "304,5919000,00016,00014,00016,08467,08398,08446,00010,00008,00010,00007,00007,00007,00016,00014,00016,08467,08396,08446,00030,00027,00026,08423,08371,08431,00022,00016,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "305,5959000,00017,00014,00016,08468,08401,08443,00010,00008,00009,00007,00006,00007,00017,00013,00015,08468,08400,08443,00027,00027,00026,08421,08377,08429,00020,00015,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "306,5999000,00018,00012,00016,08469,08404,08443,00011,00008,00010,00007,00006,00007,00018,00014,00016,08469,08403,08443,00030,00027,00027,08421,08377,08428,00022,00015,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "307,6039000,00016,00013,00016,08471,08407,08440,00011,00008,00010,00006,00006,00006,00016,00013,00016,08471,08405,08440,00030,00027,00027,08423,08380,08424,00022,00015,00017,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "308,6079000,00016,00014,00016,08472,08408,08439,00010,00008,00010,00007,00006,00007,00016,00014,00016,08472,08407,08439,00027,00027,00026,08423,08382,08424,00019,00015,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "309,6119000,00016,00013,00015,08471,08410,08438,00011,00008,00010,00006,00006,00006,00016,00013,00015,08471,08410,08438,00030,00030,00026,08423,08384,08422,00019,00018,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "310,6159000,00016,00013,00016,08474,08413,08435,00011,00009,00010,00006,00006,00007,00016,00013,00016,08474,08411,08435,00030,00027,00025,08423,08386,08424,00021,00016,00017,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "311,6199000,00018,00013,00017,08474,08415,08435,00011,00008,00010,00007,00006,00008,00018,00013,00016,08474,08413,08435,00027,00027,00027,08425,08387,08422,00020,00016,00019,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "312,6239000,00017,00012,00016,08474,08416,08435,00011,00008,00009,00007,00006,00007,00017,00013,00017,08474,08415,08435,00027,00030,00027,08425,08391,08421,00019,00018,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "313,6279000,00017,00013,00015,08474,08419,08432,00010,00008,00010,00007,00006,00006,00017,00013,00016,08474,08416,08432,00027,00027,00025,08423,08391,08419,00019,00017,00017,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "314,6319000,00016,00013,00017,08476,08421,08432,00010,00008,00010,00006,00006,00007,00016,00013,00017,08476,08420,08432,00027,00027,00025,08427,08395,08419,00020,00016,00019,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "315,6359000,00016,00013,00016,08475,08423,08432,00010,00009,00010,00007,00006,00007,00016,00013,00016,08475,08421,08432,00027,00027,00027,08425,08396,08419,00020,00015,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "316,6399000,00017,00014,00015,08475,08423,08431,00011,00009,00009,00007,00006,00006,00017,00014,00015,08475,08423,08431,00027,00027,00025,08427,08396,08419,00021,00016,00019,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "317,6439000,00016,00013,00015,08474,08424,08430,00009,00008,00009,00007,00006,00006,00016,00013,00015,08474,08424,08430,00027,00027,00025,08425,08398,08415,00020,00017,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "318,6479000,00016,00012,00016,08475,08427,08431,00011,00008,00009,00006,00006,00007,00016,00012,00015,08475,08425,08431,00027,00027,00027,08427,08400,08415,00021,00015,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "319,6519000,00016,00014,00015,08474,08426,08428,00010,00009,00009,00006,00006,00006,00016,00014,00016,08474,08427,08428,00027,00027,00026,08425,08402,08413,00020,00016,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "320,6559000,00016,00013,00015,08475,08428,08426,00011,00008,00009,00006,00006,00006,00016,00013,00015,08475,08428,08426,00027,00027,00027,08428,08404,08413,00021,00016,00017,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "321,6599000,00018,00013,00016,08474,08430,08424,00011,00009,00010,00007,00006,00006,00018,00012,00016,08474,08429,08424,00027,00027,00025,08427,08405,08410,00019,00017,00016,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "322,6639000,00016,00012,00017,08471,08432,08422,00011,00008,00010,00006,00006,00007,00016,00013,00016,08471,08430,08422,00027,00027,00025,08425,08405,08406,00021,00016,00019,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "323,6679000,00017,00014,00015,08471,08433,08420,00010,00009,00009,00007,00006,00006,00017,00012,00017,08471,08433,08420,00027,00027,00025,08427,08407,08405,00020,00017,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "324,6719000,00015,00013,00016,08469,08435,08419,00010,00008,00009,00006,00005,00007,00015,00014,00016,08469,08433,08419,00027,00027,00027,08423,08409,08405,00019,00016,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "325,6759000,00016,00013,00015,08470,08434,08415,00011,00008,00009,00006,00006,00007,00016,00013,00015,08470,08435,08415,00027,00027,00027,08423,08412,08403,00020,00017,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "326,6799000,00017,00014,00015,08469,08438,08410,00010,00009,00009,00007,00006,00006,00017,00013,00015,08469,08438,08410,00027,00027,00026,08425,08412,08403,00020,00016,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "327,6839000,00017,00014,00015,08468,08439,08409,00011,00009,00009,00006,00006,00006,00017,00014,00015,08468,08437,08409,00027,00027,00025,08423,08411,08399,00019,00017,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "328,6879000,00016,00013,00016,08469,08439,08405,00010,00009,00010,00006,00006,00007,00016,00013,00016,08469,08439,08405,00030,00027,00025,08421,08414,08397,00021,00017,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "329,6919000,00017,00013,00016,08469,08439,08401,00010,00008,00009,00007,00006,00007,00017,00013,00016,08469,08439,08401,00030,00027,00025,08423,08411,08396,00021,00016,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "330,6959000,00016,00013,00015,08468,08442,08401,00011,00008,00009,00006,00006,00006,00016,00013,00015,08468,08441,08401,00027,00027,00025,08423,08414,08394,00020,00016,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "331,6999000,00017,00014,00015,08469,08443,08397,00010,00008,00009,00007,00006,00007,00017,00014,00015,08469,08442,08397,00027,00027,00025,08423,08414,08390,00021,00015,00017,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "332,7039000,00016,00013,00016,08469,08444,08395,00011,00009,00009,00007,00006,00007,00016,00013,00016,08469,08444,08395,00027,00027,00027,08421,08418,08390,00020,00016,00018,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "333,7079000,00017,00012,00016,08467,08448,08395,00011,00008,00009,00007,00006,00007,00017,00013,00016,08467,08446,08395,00030,00030,00026,08421,08418,08390,00020,00018,00017,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1\n" +
        "334,7119000,00003,-00010,00002,08469,-04337,-04097,00001,-00006,00000,00002,-00004,00002,-00012,00000,00009,-00058,-07341,07416,00020,-00007,-00016,-00250,-07171,07436,00008,-00007,-00007,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1";
    var midData = midStr.split('\n');
    midData = midData.map(function (item) {
        return item.split(',').map(function (numItem) {
            return parseInt(numItem);
        })
    });

    var waveDataCount = parseInt(cfgStr[2+cfgCount]);
    var waveDataSplitCount = parseInt(cfgStr[3+cfgCount]);
    var waveDataGroup = cfgStr.slice(4+cfgCount, 4+cfgCount+waveDataSplitCount);
    waveDataGroup = waveDataGroup.map(function(groupStr) {
        var groupItem = groupStr.split(',');
        return {
            frequency: parseInt(groupItem[0]),
            count: parseInt(groupItem[1])
        }
    });

    if (waveDataGroup[waveDataGroup.length-1].count === midData.length) {
        for (var i = 0; i < waveDataGroup.length; i++) {
            let groupItem = waveDataGroup[i];
            groupItem.min = i === 0 ? 0 : waveDataGroup[i-1].count;
            groupItem.max = groupItem.count - 1;
        }
    } else {
        for (var i = 0; i < waveDataGroup.length; i++) {
            let groupItem = waveDataGroup[i];
            groupItem.min = i === 0 ? 0 : (waveDataGroup[i-1].max + 1);
            groupItem.max = groupItem.min + groupItem.count - 1;
        }
    }

    if (midData.length > 0) {
        var dataLen = midData[0].length;

        var maxDescWidth = 0;
        var canvasContext = document.createElement('canvas').getContext('2d');
        canvasContext.font = '18px';
        cfgResultData.map(function (cfgDataItem) {
            var currentWidth = Math.floor(canvasContext.measureText(cfgDataItem.name).width);
            maxDescWidth = Math.max(maxDescWidth, currentWidth);
        });

        for (var i = 2; i < dataLen; i++) {
            var yData = [];
            for(var j = 0; j < midData.length; j++) {
                var yDataItem = midData[j][i];
                if (i - 2 < analogQuantityCount) {
                    var fCoefA = cfgResultData[i - 2].fCoefA;
                    var fCoefB = cfgResultData[i - 2].fCoefB;
                    yDataItem = fCoefA * yDataItem + fCoefB;
                } else {
                    yDataItem = parseInt(yDataItem);
                }
                yData.push([midData[j][1], yDataItem]);
            }
            cfgResultData[i-2].data = yData;
        }

        $.loadChartData(cfgResultData);
    }

    $.reloadTransferEffectData(cfgResultData);
});