$.initTable = function () {
    var tableBox = new twaver.ElementBox();
    var table = new twaver.controls.Table(tableBox);

    function createColumn(table, name, propertyName, propertyType, valueType) {
        var column = new twaver.Column(name);
        column.setName(name);
        column.setPropertyName(propertyName);
        column.setPropertyType(propertyType);
        if (valueType) {
            column.setValueType(valueType);
        }
        table.getColumnBox().add(column);
        return column;
    }

    var tablePane = new twaver.controls.TablePane(table);
    window.addEventListener('resize', function () {
        tablePane.invalidate();
    });
    var timeColumn = createColumn(table, '时间', 'time', 'client', 'string');
    timeColumn.setWidth(64);
    var nameColumn = createColumn(table, '设备名称', 'name', 'client', 'string');
    nameColumn.setWidth(220);
    var eventColumn = createColumn(table, '事件', 'event', 'client', 'string');
    eventColumn.setWidth(96);

    var i = 100;
    while (i > 0) {
        var data = new twaver.Node();
        data.setClient('time', i + 'ms');
        data.setClient('name', '220kV线路PCS保护');
        data.setClient('event', '保护启动');
        tableBox.add(data);
        i--;
    }

    return tablePane;
}