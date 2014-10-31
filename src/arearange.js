/**
 * @fileOverview 区域区间图序列
 * @ignore
 */


var Series = require('achart-series'),
  Util = require('achart-util');

var Arearange = function(cfg){
  Arearange.superclass.constructor.call(this,cfg);
};

Util.extend(Arearange,Series.Cartesian);

Arearange.ATTRS = {
    elCls : 'x-chart-arearange-series',

    /**
     * 是否忽略null的值，连接null2边的值
     * @type {Boolean}
     */
    connectNulls : false,  
    /**
     * 区域图形的配置
     * @type {Object}
     */
    area : {

    },
    /**
     * 线的配置
     * @type {Object}
     */
    line : {

    },
    /**
     * 激活线的配置
     * @type {Object}
     */
    lineActived: {

    },
    /**
     * 激活区域图形的配置
     * @type {Object}
     */
    areaActived: {

    }
};

Util.augment(Arearange,{
    //处理颜色
    processColor : function(color){
      var _self =this,
        line = _self.get('line'),
        area = _self.get('area');
      if(!line.stroke){
        line.stroke = color;
      }
      if(!area.fill){
        area.fill = color;
      }
    },
    //覆写draw方法
    draw : function(points,callback){
      var _self = this;
      if(_self.get('animate')){
        _self.animateClip(function(){
          _self._drawArea(points);
          _self._drawLine(points);
        },callback);
      }else{
         _self._drawArea(points);
        _self._drawLine(points);
      }
      console.log(JSON.stringify(points));
    },
    /**
     * 获取提示信息
     * @return {*} 返回显示在上面的文本
     */
    getTipInfo : function(point){
        return point.lowValue + " ~ " + point.highValue;
    },
    getData : function(type){
        var _self = this,
            data = _self.get('data'),
            rst = [];
        if(type == 'xAxis'){
            rst = Util.map(data,function(item){
                return item[0];
            });
        }else{
            Util.each(data,function(item){
                var tmp = item.slice(1,3);
                rst.push(Math.max.apply(null,tmp));
                rst.push(Math.min.apply(null,tmp));
            });
        }
        return rst;
    },
    //重写方法
    processPoint: function(point){
      var _self = this,
          arr = point.arr,
          length = arr.length,
          yAxis = _self.get('yAxis');

      point.lowY = point.y;
      point.lowValue = arr[length - 2];
      point.highY = yAxis.getOffset(arr[length - 1]);
      point.highValue = arr[length - 1];

      return point;
    },
    /**
     * @private
     * 重写获取点
     */
    /*_getPoints : function(){
      var _self = this,
        data = _self.get('data'),
        xField = _self.get('xField'),
        yField = _self.get('yField'),
        points = [];
      Util.each(data,function(item,index){
        var point,highPoint;
        if(Util.isArray(item)){
          if(item.length == 2){
            point = _self.getPointByIndex(item[0],index);
            highPoint = _self.getPointByIndex(item[1],index);
            
          }else if(item.length == 3){
            point= _self.getPointByValue(item[0],item[1]);
            highPoint = _self.getPointByValue(item[0],item[2]);
          }

          point.lowY = point.y;
          point.lowValue = point.value;
          point.highY = highPoint.y;
          point.hightValue = highPoint.value;

          point.arr = item;   
        }
        point.name = point.name || _self.get('name');
        point.seriesName =  _self.get('name');
        _self.processPoint(point,index);
        points.push(point);
      });
      return points;
    },*/
    //绘制line
    _drawLine : function(points){
      var _self = this,
        line = _self.get('line'),
        cfg = Util.mix({},line);

      cfg.path = _self.point2path(points);
      lineShape = _self.addShape('path',cfg);

      _self.set('lineShape',lineShape);
    },
    //绘制area
    _drawArea : function(points){
      var _self = this,
        area = _self.get('area'),
        cfg = Util.mix({},area);

      cfg.path = _self.point2Area(points);
      var areaShape = _self.addShape('path',cfg);
      _self.set('areaShape',areaShape);
    },
    //获取第一个非null节点
    _getFirstPoint : function(points){
      var rst = null;
      Util.each(points,function(point,index){
        if(point.value != null){
          rst = point;
          rst.index = index;
          return false;
        }
      });
      return rst;
    },
    //获取最后一个非null节点
    _getLastPoint : function(points){
      var rst = null;
      for(var i = points.length - 1; i >=0 ; i--){
        var point = points[i];
        if(point.value != null){
          rst = point;
          rst.index = i;
          break;
        }
      }
      return rst;
    },
    _getNextPoint: function(points,index){
      var rst = null;
      for(var i = index; i < points.length ; i++){
        var point = points[i];
        if(point.value != null){
          rst = point;
          rst.index = i;
          break;
        }
      }
      return rst;
    },
    //获取线的path
    getLinePath : function(points){
      var _self = this,
          connectNulls = _self.get('connectNulls'),
          count = points.length,
          firstPoint = _self._getFirstPoint(points) || points[0],
          lastPoint = _self._getLastPoint(points) || points[count - 1],
          path = [];

      var linePath = {
        lowPath:[],
        highPath: []
      },
      notNullArray = [],
      lineRange = [];


      //现获取不为null的数组的节点
      for(var index = 0; index < count ; index++){
        var item = points[index];

        if(item.value != null){
          notNullArray.push(index)
        }
      }

      //根据notNullArray生成各个区间的开始节点和结束节点
      var preIndex,startIndex,endIndex;
      Util.each(notNullArray,function(index,i){
        if(i == 0){
          startIndex = index;
        }
        else if(preIndex + 1 != index){
          lineRange.push({
            startIndex: startIndex,
            endIndex: preIndex
          });
          startIndex = index;

          if((i == notNullArray.length - 1)){
            lineRange.push({
              startIndex: index,
              endIndex: index
            })
          }
        }
        else if((i == notNullArray.length - 1)){
          lineRange.push({
            startIndex: startIndex,
            endIndex: notNullArray[i]
          })
        }
        preIndex = index
      });


      Util.each(lineRange,function(item,index){
        var highArr = [],
            lowArr = [],
            startIndex = item.startIndex,
            endIndex = item.endIndex;

        //高点path
        highArr.push(['M',points[startIndex].x,points[startIndex].highY]);
        if(startIndex == endIndex){
          highArr.push(['L',points[endIndex].x,points[endIndex].highY]);
        }
        for(var i = startIndex + 1; i <= endIndex;i++){
          var item = ['L',points[i].x,points[i].highY];
          highArr.push(item);
        }

        //低点path
        lowArr.push(['M',points[endIndex].x,points[endIndex].lowY]);
        if(startIndex == endIndex){
          lowArr.push(['L',points[endIndex].x,points[endIndex].highY]);
        }
        for(var i = endIndex - 1;i >=startIndex ;i--){
          var item = ['L',points[i].x,points[i].lowY];
          lowArr.push(item);
        }

        linePath.highPath.push(highArr);
        linePath.lowPath.push(lowArr);

      });

      //连接null
      if(connectNulls){
        var newHigh = [],newLow = [],len = linePath.highPath.length;
        for(var i = 0;i < len; i++){
          var highPath = linePath.highPath[i],
              lowPath = linePath.lowPath[len - i - 1];

          if(i > 0){
            highPath[0][0] = 'L';
            lowPath[0][0] = 'L';
          }
          for(var j = 0;j < highPath.length ;j ++){
            newHigh.push(highPath[j]);
          }
          for(var j = 0;j < lowPath.length ;j ++){
            newLow.push(lowPath[j]);
          }
        }

        linePath = {
          lowPath:[newLow],
          highPath: [newHigh]
        }
      }
      console.log(linePath);
      return linePath;
    },
    point2path: function(points){
      var _self = this,
          connectNulls = _self.get('connectNulls'),
          linePath = _self.getLinePath(points),
          path = [],highPath = [],lowPath = [];

      Util.each(linePath.highPath,function(item,index){
        highPath = highPath.concat(item);
      });

      Util.each(linePath.lowPath,function(item,index){
        lowPath = lowPath.concat(item);
      });

      path = highPath.concat(lowPath);
      return path;
    },
    //获取区域的path
    point2Area : function(points){
      var _self = this,
        linePath = _self.getLinePath(points),
        pathArrs = [],
        path = [];

      Util.each(linePath.lowPath,function(item,index){
        var currHigh = linePath.highPath[index],
            currPath = [];

        item[0][0] = 'L'

        currPath = currHigh.concat(item);
        currPath.push(['z']);

        pathArrs.push(currPath)
      });

      path = pathArrs.join();  

      return path;
    },
    //更改数据时
    changeShapes : function(points){
      var _self = this,
        lineShape = _self.get('lineShape'),
        areaShape = _self.get('areaShape'),
        linePath = _self.point2path(points),
        areaPath = _self.point2Area(points);     

      if(_self.get('animate')){
        Util.animPath(areaShape,areaPath);
        Util.animPath(lineShape,linePath);
      }else{
        lineShape.attr('path',linePath);
        areaShape.attr('path',areaPath);
      }

    },
    /**
     * @protected
     * 设置图形的激活状态
     * @param {Boolean} actived 是否激活
     */
    setActiveStatus : function(actived){
      var _self = this,
        line = _self.get('line'),
        area = _self.get('area'),
        lineShape = _self.get('lineShape'),
        areaShape = _self.get('areaShape'),
        lineActived = _self.get('lineActived'),
        areaActived = _self.get('areaActived');
      if(actived){
        lineActived && lineShape.attr(lineActived);
        areaActived && areaShape.attr(areaActived);
      }else{
        line && lineShape.attr(line);
        area && areaShape.attr(area);
      }
    }
});

module.exports = Arearange;