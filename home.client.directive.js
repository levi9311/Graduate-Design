angular.module('core').directive('donutChart', function(){
  function link(scope, el, attr){
    

  overview = function(el){
    var _myself = this;
    var el = el;
    var start_time = undefined;
    var end_time = undefined;
    var select_time = undefined;
    var date_tag = 0;
    var date_time = undefined;
    var influence = undefined;
    var consume = undefined;
    var dicon_count = 0;

    this.set_influence = function(d){
      influence = d.influence2;
    }

    this.set_consume = function(d){
      consumeProcess(d, 2);
      consume = d;
    }


    this.render = function(){ 
      var stack = d3.layout.stack().offset("wiggle");
      var width = 8000;
      var height = 800;
      var consumeLayers = undefined;
      var influenceLayers = undefined;
        // var bottomLayers = ['core1', 'core2', 'core3', 'core4', 'common1', 'common2', 'common3', 'common4'];
      var bottomLayers = ['c1', 'c2', 'c3', 'c4', 'c5'];
      var layerNum = bottomLayers.length;
      var upperlayerNum = 4;
      var datetime = Object.keys(consume);
      var interval = 5;// 10px interval between 2 flows
      var padding = 20;// 3px padding top, end
      var color = d3.scale.category10();

      datetime = datetime.sort();

      consumeLayers = d3.range(layerNum).map(function(d1, i){ 
        return datetime.map(function(d2, j){
          return {x: j, y: Math.sqrt(consume[d2][bottomLayers[i]]), 'datetime': datetime[j]};
        });
      });
      consumeLayers = stack(consumeLayers);

      var maxy = d3.max(consumeLayers, function(layer) { return d3.max(layer, function(d) { return d.y0 + d.y; }); });
      var py = (maxy / (height-2*padding-(layerNum-1)*interval))*interval;
      consumeLayers = consumeLayers.map(function(d, i){
        return d.map(function(d, j){
          d.y0 += i*py;
            return d;
        });
      });

      influenceLayers = d3.range(layerNum).map(function(d, i){ // i consume layer
        return d3.range(upperlayerNum).map(function(d, j){// j influence layer
          return datetime.map(function(d, k){
            return {x: k, y: influence[d][bottomLayers[i]][j], datetime: d, trueValue: influence[d][bottomLayers[i]][j]};
          });
        });
      });

      filterUpdate(consumeLayers, influenceLayers, datetime, layerNum, upperlayerNum);

      var x = d3.scale.linear()
          .domain([0, consumeLayers[0].length-1])
          .range([50, width - 100]);

      var y = d3.scale.linear()
          .domain([0, maxy+py*(layerNum-1)])
          .range([height-padding, padding]);

      var area = d3.svg.area()
          .x(function(d) { return x(d.x); })
          .y0(function(d) { return y(d.y0); })
          .y1(function(d) { return y(d.y0 + d.y); })
          .interpolate('cardinal');

      var area1 = d3.svg.area()
          .x(function(d) { return x(d.x); })
          .y0(function(d) { return y(d.y0); })
          .y1(function(d) { return y(d.y0 + d.y); })
          .interpolate('monotone');

      var svg = d3.select(el).append('svg')
          .attr('width', width)
          .attr('height', height);

      svg.selectAll('.consume')
          .data(consumeLayers)
          .enter().append('path')
          .classed('consume', true)
          .attr('d', area)
          .attr('fill', '#ddd')
          .on('mouseover', function(d,i){
            svg.selectAll('.transition').remove();
            svg.selectAll('.dashline').remove();
          })
          .on('dblclick', function(d,i){
            for(var k = 0; k < dicon_count; k++){
              var nodei = '.node' + k;
              svg.selectAll(nodei).remove();
            }
            svg.selectAll('.dragline').remove();
          });;

      svg.selectAll('.dateline')
          .data(datetime)
          .enter().append('g')
          .classed('dateline', true)
          .selectAll('path')
          .data(datetime)
          .enter()
          .append('path')
          .attr('d', function(d, i){
            return 'M' + x(i) + ' 20' + ' ' + x(i) + ' ' + height;
          })
          .attr('stroke', '#9D9D9D')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '10 10')
          .attr('fill', 'none')
          .on('click', function(d,i){
            dline = this.parentNode.childNodes;
            if(d3.select(this).attr('stroke') == '#000'){
              console.log(d3.select(this).attr('stroke'));
              d3.select(this).attr('stroke', '#9D9D9D');
              console.log(d3.select(this).attr('stroke'));
            }
            else{
              for(var j = 0; j < dline.length; j++){
                if(d3.select(dline[j]).attr('stroke') == '#000')
                  d3.select(dline[j]).attr('stroke', '#9D9D9D');
              }
              d3.select(this).attr('stroke', '#000');
            }
          });

      svg.selectAll('text')
          .data(datetime)
          .enter()
          .append('text')
          .attr('x', function(d, i){ return x(i); })
          .attr('y', 20)
          .attr('text-anchor', 'middle')
          .text(function(d){ return d; });

      svg.selectAll('.influence')
          .data(influenceLayers)
          .enter().append('g')
          .classed('influence', true)
          .selectAll('path')
          .data(function(d){ return d; })
          .enter().append('path')
          .attr('d', area)
          .attr('fill', function(d, i){ return color(i); })
          .attr('fill-opacity', 1)
          .attr('stroke', '#ddd')
          .on('click', function(d,i){
            var pos = d3.mouse(this);
            var getD = 0, getL = 0;
            console.log(d3.mouse(this));
            for(j in datetime){
              if(pos[0] < (x(j) + x(parseInt(j)+1))/2 && pos[0] >= x(j)){
                getV = j;
                break;
            }
              if(pos[0] > (x(j) + x(parseInt(j)+1))/2 && pos[0] <= x(parseInt(j)+1)){
                console.log(pos[0]);
                console.log(x(j));
                console.log(x(parseInt(j)+1));
                getV = parseInt(j)+1;
                break;
              }
            }
            console.log(getV);
            for(var k = 0; k < 5; k++){
              getL = 5;
              if(pos[1] > y(consumeLayers[k][getV]['y0']))  {
                getL = k;
                break;
              }
            }
            console.log(getL);
            var begin = {x: influenceLayers[getL-1][i][getV]['x'],
                         y: influenceLayers[getL-1][i][getV]['y'],
                         y0: influenceLayers[getL-1][i][getV]['y0']};
            var end = {x: influenceLayers[getL-1][i][getV]['x'],
                       y: influenceLayers[getL-1][i][getV]['y'],
                       y0: influenceLayers[getL-1][i][getV]['y0']};
            var Tdata2 = [begin, end];
            svg.selectAll('.highlight').remove();
            var hcolor = d3.rgb(color(i)).brighter(1.5).toString()
            var showx = x(begin['x']);
            var showy = y(begin['y0']);
            console.log(datetime[getV-1]);
            var filename = '';
            if(getV == 0)
              filename = 'data/CorePlayers_/2013-07-02_2013-07-15';
            else if(getV == 48)
              filename = 'data/CorePlayers_/2013-07-02_2013-07-15';
            console.log('new');
            var vis = new showDicon(svg, showx, showy);
            var nodei = 'node' + dicon_count;
            dicon_count++;
            console.log(vis);
            d3.csv("data/output.csv", function(error, data) {
              vis.clear().data(data).layout().render(nodei);
            });

            console.log(d3.rgb(color(i)).brighter(1).toString());

          })
          .on('mouseover', function(d,i){
            showTransistion(i);
          })
          .on('mouseout', function(d,i){
          });

      showDicon = function(svg, showx, showy){
          var nsize = d3.scale.linear().range([3, 20]);
          var showx = showx;
          var showy = showy;
            
            // render parameters
          var color = d3.scale.category10();
          var _self = this;
          var svg = svg;
          var _plates = [], _features = [];
          var _size = [8000, 800];
          var _force = d3.layout.force()
                         .charge(-120)
                         .linkDistance(30)
                         .size(_size);
          this.data = function(x) {
            if(arguments.length === 0) {
              return _features;
            }
              
            _features = x;
             
            var plates = {};
            for(var i = 0; i < x.length; ++i) {
              var id = x[i].plate_id;
              var p = plates[id];
              if(!p) {
                p = {features:[], id:id}
                plates[id] = p;
                _plates.push(p);
              }
              p.features.push(x[i]);
            }
            plates = undefined;
              
            for(var i = 0; i < _plates.length; ++i) {
              _plates[i].features.sort(function(a, b){
                return parseInt(a.feature_type) - parseInt(b.feature_type); 
              });
            }
              
            return _self;
          };

            this.render = function(nodei) {
              var vnodes = svg.selectAll('.' + nodei)
                .data(_plates, function(d){return d.id;});

              var drag = d3.behavior.drag()
                           .origin(function(d) { return d; })
                           .on('drag', dragmove);
              function dragmove(d) {
                  d.x += d3.event.dx;
                  d.y += d3.event.dy;
                  console.log(d.x);
                  d3.select(this)
                    .attr('transform','translate('+d.x+','+d.y+')');

                  svg.selectAll('.dragline').remove();

                  line_begin = {x: showx, y: showy};
                  line_end = {x: d.x, y: d.y};
                  line_data = [line_begin, line_end];

                  svg.append('line')
                    .classed('dragline', true)
                    .attr('x1', showx)
                    .attr('y1', showy)
                    .attr('x2', d.x)
                    .attr('y2', d.y)
                    .attr('stroke', '#000')
                    .attr('stroke-opacity', 1);
              }

                
              var ng = vnodes.enter()
                .append("g")
                .attr("class", nodei)
                .attr("transform", function(d) {return 'translate(' + d.x + ',' + d.y + ')';})
                .call(drag)
                .on('dblclick', function(d,i){
                  d3.select(this).remove();
                });
                
                ng.append("circle")
                .attr("r", function(d) {
                  return d.r;
                })
                .style("fill", function(d) {return color(d.plate_id);})
                .style('stroke-width', function(d){
                  return .5;
                })
                .style('stroke', function(d){
                  return "grey";
                });
                
              
              var icon = ng.each(pack);
              
              return _self;     
            };

            function pack(plate) {
              var icon = d3.select(this);
            
              bound = [];
              // type 1 : circular bondary
              var step = 2 * Math.PI / 50;
              for(var i = 49; i >=0; --i) {
                var x = plate.r * Math.cos(i * step);
                var y = plate.r * Math.sin(i * step);
                bound.push([x, y]);
              }
                
              /*
          // type 2 : rectangular boundary
              bound.push([-1 * cube.r, -1 * cube.r]);
              bound.push([-1 * cube.r, cube.r]);
              bound.push([cube.r, cube.r]);
              bound.push([cube.r, -1 * cube.r]);
          */
              bound = d3.geom.polygon(bound);
              
              var fs = plate.features;
              
              var step = 2.0 * Math.PI / fs.length;
              
              for(var i = 0; i < fs.length; ++i) {
                var angle = step * i;
                var r = 0.8 * Math.random() * plate.r;//0.8 * Math.random * plate.r;
                fs[i].x = r * Math.cos(angle);
                fs[i].y = r * Math.sin(angle);
              }
                  

              var voronoi = d3.geom.voronoi();
              voronoi.x(function(d){return d.x;});
              voronoi.y(function(d){return d.y;});
              
              var dist = Infinity;
              var iteration = 0;
              var cnt = 0;
              while(cnt < 10) {
                var p = voronoi(fs);
                var dist = 0;
                var ccnt = 0;
                for(var i = 0; i < p.length; ++i) {
                  var centroid = d3.geom.polygon(bound.clip(p[i])).centroid();
                  if(!isNaN(centroid[0]) && !isNaN(centroid[1])) {
                    fs[i].p = p[i];
                    dist += Math.sqrt((fs[i].x - centroid[0]) * (fs[i].x - centroid[0]) 
                      + (fs[i].y - centroid[1]) * (fs[i].y - centroid[1]));
                    fs[i].x = centroid[0];
                    fs[i].y = centroid[1];
                    ccnt ++;
                  } else {
                    dist += 100000;
                  }
                }
                dist /= p.length;
                if(dist <= plate.r * 0.001) {
                  cnt ++;
                } else {
                  cnt = 0;
                }
                iteration ++;
              }
                    
              icon.append("circle")
                .attr("r", function(d) {return d.r;})
                .style("fill", function(d) {return 'white';})
                .style('stroke-width', function(d){
                  return .5;
                })
                .style('stroke', function(d){
                  return "grey"
                });
              icon.selectAll(".cell")
                .data(fs)
                .enter().append("g")
                .attr("class", "cell")
                .append("path")
                .attr("d", function(d) {
                  var path = "M" + bound.clip(d.p).join("L") + "Z";
                  return path;
                })
                .style("fill", function(d, i) {
                  return d3.rgb(color(d.feature_type)).brighter(d.probability+1).toString();

                  //var hcolor = d3.rgb(color(i)).brighter(1.5).toString()
                })
                .style("fill-opacity", function(d) {
                  return 1;
                  //return parseFloat(d.probability) + 0.6;
                })
                .style("stroke", 'lightgrey')
                .style("stroke-width", .3)


              console.log('end');
            };

            this.layout = function(labels) {
        
              _force
                .nodes(_plates)
                .charge(function(d) { return (-120 - Math.sqrt(d.features.length) * 60);})
                .size(_size)
                .on("tick", null);
                
              var n = _plates.length;
              
              nsize.domain([1, _features.length]).range([10, _features.length * 2]);
              var px = 0;
              for (var i = 0; i < n; ++i) {
                _plates[i].r = 6372 / 80;
                console.log(nsize(_plates[i].features.length));
                _plates[i].x = px + showx;
                _plates[i].y = showy;
                px = _plates[i].x + 120 + _plates[i].r;
              }
                  
              /*
          _force.start();
              for (var i = 0; i < n; ++i) {
                for(var j = 0; j < n; ++j) {
                  var q = d3.geom.quadtree(_plates);
                  q.visit(collide(_plates[j]));
                  _force.tick();
                }
              } 
              _force.stop();
          */
              
              var minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity;
              for (var i = 0; i < n; ++i) {     
                minx = Math.min(_plates[i].x - 2 * _plates[i].r, minx);
                miny = Math.min(_plates[i].y - 2 * _plates[i].r, miny);
                maxx = Math.max(_plates[i].x + 2 * _plates[i].r, maxx);
                maxy = Math.max(_plates[i].y + 2 * _plates[i].r, maxy);
              }
              var xx = (minx + maxx) / 2.0;
              var yy = (miny + maxy) / 2.0;
              var ww = (maxx - minx);
              var hh = (maxy - miny);
              
              //_self.render();
              _origin = [xx, yy, Math.max(ww, hh) * 0.5];
              //_vis.call(focus, _origin, function(){$('circle').tipsy('show');});
              
              return _self;
            };

            this.clear = function() {
              _features = [];
              _plates = [];
              return _self;
            };
      }

      showTransistion = function(cat){
            var cat0 = cat + 1;
            d3.json('data/transition.json', function(err, transis){
              var minTransitionProportion = document.getElementById('filter3').value / 100;
              transistion = transis;
              //console.log(transistion);
              //console.log(influenceLayers);
              svg.selectAll('.transition').remove();
              svg.selectAll('.dashline').remove();
              for(var i = 0; i < datetime.length - 1; i++){ //i denotes date
                //console.log(transistion[datetime[i]]['1']);
                for(j in transistion[datetime[i]][cat0.toString()]){ //j denotes begin point
                  for(k in transistion[datetime[i]][cat0.toString()][j]){  //k denotes end point
                    if(transistion[datetime[i]][cat0.toString()][j][k] > minTransitionProportion){
                      var begin = {x: influenceLayers[j][cat0-1][i]['x'],
                                   y: influenceLayers[j][cat0-1][i]['y'],
                                   y0: influenceLayers[j][cat0-1][i]['y0']};
                      var begin = {x: influenceLayers[j][cat0-1][i]['x'],
                                   y: influenceLayers[j][cat0-1][i]['y'],
                                   y0: influenceLayers[j][cat0-1][i]['y0']};
                      var end = {x: influenceLayers[k][cat0-1][parseInt(i)+1]['x'],
                                 y: influenceLayers[k][cat0-1][parseInt(i)+1]['y'],
                                 y0: influenceLayers[k][cat0-1][parseInt(i)+1]['y0']};
                      var mid_1_1 = {x: begin['x'] * 7 / 8 + end['x'] / 8,
                                     y: begin['y'] / 2,
                                    y0: begin['y0'] * 63 / 64 + end['y0'] / 64};
                      var mid_1 = {x: begin['x'] * 3 / 4 + end['x'] / 4,
                                   y: begin['y'] / 2,
                                   y0: begin['y0'] * 15 / 16 + end['y0'] / 16};
                      var mid_1_2 = {x: begin['x'] * 5 / 8 + end['x'] * 3 / 8,
                                   y: begin['y'] / 2,
                                   y0: begin['y0'] * 47 / 64 + end['y0'] * 17 / 64};
                      var mid_2 = {x: begin['x'] / 4 + end['x'] * 3 / 4,
                                   y: end['y'] / 2,
                                   y0: begin['y0'] / 16 + end['y0'] * 15 / 16};
                      var mid_2_1 = {x: begin['x'] / 8 + end['x'] * 7 / 8,
                                     y: end['y'] / 2,
                                     y0: begin['y0'] / 64 + end['y0'] * 63 / 64};
                      var mid_2_2 = {x: begin['x'] * 3 / 8 + end['x'] * 5 / 8,
                                   y: begin['y'] / 2,
                                   y0: begin['y0'] * 17 / 64 + end['y0'] * 47 / 64};
                      Tdata = [begin, mid_1, mid_2, end];
                      Tdata1 = [begin, mid_1_1, mid_1, mid_1_2];
                      Tdata2 = [mid_2_2, mid_2, mid_2_1, end];
                      Ddata = [mid_1_2, mid_2_2];
                      //console.log(i);
                      if(begin['y'] == 0 || end['y'] == 0)
                        continue;
                      if(j == k)
                        continue;
                      //console.log(Tdata);
                      /*var t = svg.append('path')
                         .classed('transition', true)
                         .attr('d', area(Tdata))
                         .attr('fill', function(d, i){ return color(i); })
                         .attr('fill-opacity', 1)
                         .attr('stroke', function(d, i){ return color(i); });*/
                      //console.log(area(Tdata));

                      var t = svg.append('path')
                         .classed('transition', true)
                         .attr('d', area(Tdata1))
                         .attr('fill', color(cat0-1))
                         .attr('fill-opacity', 1)
                         .attr('stroke', color(cat0-1))
                         .attr('stroke-opacity', 0)
                         .on('click', function(d,i){
                            var pos = d3.mouse(this);
                            var getD = 0, getL = 0;
                            console.log(d3.mouse(this));
                            for(j in datetime){
                              if(pos[0] < (x(j) + x(parseInt(j)+1))/2 && pos[0] >= x(j)){
                                getV = j;
                                break;
                            }
                              if(pos[0] > (x(j) + x(parseInt(j)+1))/2 && pos[0] <= x(parseInt(j)+1)){
                                console.log(pos[0]);
                                console.log(x(j));
                                console.log(x(parseInt(j)+1));
                                getV = parseInt(j)+1;
                                break;
                              }
                            }
                            console.log(getV);
                            for(var k = 0; k < 5; k++){
                              getL = 5;
                              if(pos[1] > y(consumeLayers[k][getV]['y0']))  {
                                getL = k;
                                break;
                              }
                            }
                            console.log(getL);
                            var begin = {x: influenceLayers[getL-1][i][getV]['x'],
                                         y: influenceLayers[getL-1][i][getV]['y'],
                                         y0: influenceLayers[getL-1][i][getV]['y0']};
                            var end = {x: influenceLayers[getL-1][i][getV]['x'],
                                       y: influenceLayers[getL-1][i][getV]['y'],
                                       y0: influenceLayers[getL-1][i][getV]['y0']};
                            var Tdata2 = [begin, end];
                            svg.selectAll('.highlight').remove();
                            var hcolor = d3.rgb(color(i)).brighter(1.5).toString()
                            var showx = x(begin['x']);
                            var showy = y(begin['y0']);
                            console.log(datetime[getV-1]);
                            var filename = '';
                            if(getV == 0)
                              filename = 'data/CorePlayers_/2013-07-02_2013-07-15';
                            else if(getV == 48)
                              filename = 'data/CorePlayers_/2013-07-02_2013-07-15';
                            var vis = new showDicon(svg, showx, showy);
                            var nodei = 'node' + dicon_count;
                            dicon_count++;
                            console.log(vis);
                            d3.csv("data/output.csv", function(error, data) {
                              vis.clear().data(data).layout().render(nodei);
                            });


                            console.log(d3.rgb(color(i)).brighter(1).toString());

                          });


                      var t = svg.append('path')
                         .classed('transition', true)
                         .attr('d', area(Tdata2))
                         .attr('fill', color(cat0-1))
                         .attr('fill-opacity', 1)
                         .attr('stroke', color(cat0-1))
                         .attr('stroke-opacity', 0)
                         .on('click', function(d,i){
                            var pos = d3.mouse(this);
                            var getD = 0, getL = 0;
                            console.log(d3.mouse(this));
                            for(j in datetime){
                              if(pos[0] < (x(j) + x(parseInt(j)+1))/2 && pos[0] >= x(j)){
                                getV = j;
                                break;
                            }
                              if(pos[0] > (x(j) + x(parseInt(j)+1))/2 && pos[0] <= x(parseInt(j)+1)){
                                console.log(pos[0]);
                                console.log(x(j));
                                console.log(x(parseInt(j)+1));
                                getV = parseInt(j)+1;
                                break;
                              }
                            }
                            console.log(getV);
                            for(var k = 0; k < 5; k++){
                              getL = 5;
                              if(pos[1] > y(consumeLayers[k][getV]['y0']))  {
                                getL = k;
                                break;
                              }
                            }
                            console.log(getL);
                            var begin = {x: influenceLayers[getL-1][i][getV]['x'],
                                         y: influenceLayers[getL-1][i][getV]['y'],
                                         y0: influenceLayers[getL-1][i][getV]['y0']};
                            var end = {x: influenceLayers[getL-1][i][getV]['x'],
                                       y: influenceLayers[getL-1][i][getV]['y'],
                                       y0: influenceLayers[getL-1][i][getV]['y0']};
                            var Tdata2 = [begin, end];
                            svg.selectAll('.highlight').remove();
                            var hcolor = d3.rgb(color(i)).brighter(1.5).toString()
                            var showx = x(begin['x']);
                            var showy = y(begin['y0']);
                            console.log(datetime[getV-1]);
                            var filename = '';
                            if(getV == 0)
                              filename = 'data/CorePlayers_/2013-07-02_2013-07-15';
                            else if(getV == 48)
                              filename = 'data/CorePlayers_/2013-07-02_2013-07-15';
                            var vis = new showDicon(svg, showx, showy);
                            
                            var nodei = 'node' + dicon_count;
                            dicon_count++;
                            console.log(vis);
                            d3.csv("data/output.csv", function(error, data) {
                              vis.clear().data(data).layout().render(nodei);
                            });


                            console.log(d3.rgb(color(i)).brighter(1).toString());

                          });


                      //console.log(t.attr('d'));

                      var str = t.attr('d');
                      var str_seq = str.split(',');
                      //console.log(str_seq);

                      svg.append('path')
                         .classed('dashline', true)
                         .attr('d', function(d, i){
                            return 'M' + x(mid_1_2['x']) + ' ' + y(mid_1_2['y0']+mid_1_2['y']/2) + ' ' + x(mid_2_2['x']) + ' ' + y(mid_2_2['y0']+mid_2_2['y']/2);})
                         .attr('fill', color(cat0-1))
                         .attr('fill-opacity', 0)
                         .attr('stroke', color(cat0-1))
                         .attr('stroke-width', mid_1_2['y'] / 60)
                         .attr('stroke-dasharray', "10 10")
                         .attr('stroke-dashoffset', 50);
                    }
                    else{
                    }
                  }
                }
              }
            });
      }

      d3.select('#filter1').on('change', function(){
          filterUpdate(consumeLayers, influenceLayers, datetime, layerNum, upperlayerNum);
          svg.selectAll('.influence')
             .data(influenceLayers)
             .selectAll('path')
             .data(function(d){ return d; })
             .attr('d', area)
             .attr('fill', function(d, i){ return color(i); })
             .attr('fill-opacity', 1)
             .attr('stroke', '#ddd')
             .on('click', function(d,i){
                var pos = d3.mouse(this);
                var getD = 0, getL = 0;
                console.log(d3.mouse(this));
                for(j in datetime){
                  if(pos[0] < (x(j) + x(parseInt(j)+1))/2 && pos[0] >= x(j)){
                    getV = j;
                    break;
                  }
                  if(pos[0] > (x(j) + x(parseInt(j)+1))/2 && pos[0] <= x(parseInt(j)+1)){
                    console.log(pos[0]);
                    console.log(x(j));
                    console.log(x(parseInt(j)+1));
                    getV = parseInt(j)+1;
                    break;
                  }
                }
                console.log(getV);
                for(var k = 0; k < 5; k++){
                  getL = 5;
                  if(pos[1] > y(consumeLayers[k][getV]['y0']))  {
                    getL = k;
                    break;
                  }
                }
                console.log(getL);
                var begin = {x: influenceLayers[getL-1][i][getV]['x'],
                             y: influenceLayers[getL-1][i][getV]['y'],
                             y0: influenceLayers[getL-1][i][getV]['y0']};
                var end = {x: influenceLayers[getL-1][i][getV]['x'],
                             y: influenceLayers[getL-1][i][getV]['y'],
                             y0: influenceLayers[getL-1][i][getV]['y0']};
                var Tdata2 = [begin, end];
                svg.selectAll('.highlight').remove();

                var hcolor = d3.rgb(color(i)).brighter(1.5).toString();
                var showx = x(begin['x']);
                var showy = y(begin['y0']);

                console.log(datetime[getV-1]);
                var filename = '';

                if(getV == 0)
                  filename = 'data/CorePlayers_/2013-07-02_2013-07-15';
                else if(getV == 48)
                  filename = 'data/CorePlayers_/2013-07-02_2013-07-15';

                var vis = new showDicon(svg, showx, showy);
                var nodei = 'node' + dicon_count;
                dicon_count++;
                console.log(vis);
                d3.csv("data/output.csv", function(error, data) {
                  vis.clear().data(data).layout().render(nodei);
                });
                console.log(d3.rgb(color(i)).brighter(1).toString());

              })
              .on('mouseover', function(d,i){
                showTransistion(i);
              })
              .on('mouseout', function(d,i){
              });
      });

      d3.select('#filter2').on('change', function(){
          filterUpdate(consumeLayers, influenceLayers, datetime, layerNum, upperlayerNum);
          svg.selectAll('.influence')
             .data(influenceLayers)
             .selectAll('path')
             .data(function(d){ return d; })
             .attr('d', area)
             .attr('fill', function(d, i){ return color(i); })
             .attr('fill-opacity', 1)
             .attr('stroke', '#ddd')
             .on('click', function(d,i){
                var pos = d3.mouse(this);
                var getD = 0, getL = 0;
                console.log(d3.mouse(this));
                for(j in datetime){
                  if(pos[0] < (x(j) + x(parseInt(j)+1))/2 && pos[0] >= x(j)){
                    getV = j;
                    break;
                  }
                  if(pos[0] > (x(j) + x(parseInt(j)+1))/2 && pos[0] <= x(parseInt(j)+1)){
                    console.log(pos[0]);
                    console.log(x(j));
                    console.log(x(parseInt(j)+1));
                    getV = parseInt(j)+1;
                    break;
                  }
                }
                console.log(getV);
                for(var k = 0; k < 5; k++){
                  getL = 5;
                  if(pos[1] > y(consumeLayers[k][getV]['y0']))  {
                    getL = k;
                    break;
                  }
                }
                console.log(getL);
                var begin = {x: influenceLayers[getL-1][i][getV]['x'],
                             y: influenceLayers[getL-1][i][getV]['y'],
                             y0: influenceLayers[getL-1][i][getV]['y0']};
                var end = {x: influenceLayers[getL-1][i][getV]['x'],
                             y: influenceLayers[getL-1][i][getV]['y'],
                             y0: influenceLayers[getL-1][i][getV]['y0']};
                var Tdata2 = [begin, end];
                svg.selectAll('.highlight').remove();

                var hcolor = d3.rgb(color(i)).brighter(1.5).toString();
                var showx = x(begin['x']);
                var showy = y(begin['y0']);

                console.log(datetime[getV-1]);
                var filename = '';

                if(getV == 0)
                  filename = 'data/CorePlayers_/2013-07-02_2013-07-15';
                else if(getV == 48)
                  filename = 'data/CorePlayers_/2013-07-02_2013-07-15';

                var vis = new showDicon(svg, showx, showy);
                var nodei = 'node' + dicon_count;
                dicon_count++;
                console.log(vis);
                d3.csv("data/output.csv", function(error, data) {
                  vis.clear().data(data).layout().render(nodei);
                });

                console.log(d3.rgb(color(i)).brighter(1).toString());

              })
              .on('mouseover', function(d,i){
                showTransistion(i);
              })
              .on('mouseout', function(d,i){
              });
      });
    }

    function consumeProcess(consume, type){
      var datetime = Object.keys(consume);
      if(type === 1){
        for(var i = 0; i < datetime.length; i++){
          var players = Object.keys(consume[datetime[i]]);
          for(var j = 0; j < players.length; j++){
            var consumeSum = 0;
            var goods = Object.keys(consume[datetime[i]][players[j]]);
            for(var k = 0; k < goods.length; k++){
              consumeSum += consume[datetime[i]][players[j]][goods[k]];
            }
            consume[datetime[i]][players[j]] = consumeSum;
          }
        }
      }
      else if(type === 2){
        for(var i = 0; i < datetime.length; i++){
          var players = Object.keys(consume[datetime[i]]);
          var consumeSum = {};
          for(var j = 0; j < players.length; j++){
            var goods = Object.keys(consume[datetime[i]][players[j]]);
            for(var k = 0; k < goods.length; k++){
              if(!consumeSum[goods[k]])
                consumeSum[goods[k]] = 0;
              consumeSum[goods[k]] += consume[datetime[i]][players[j]][goods[k]];
            }
          }
          consume[datetime[i]] = consumeSum;
        }
      }
      return;
    }

    function filterUpdate(consumeLayers, influenceLayers, datetime, layerNum, upperlayerNum){
      var minConsumeProportion = document.getElementById('filter1').value / 100;
      var minInfluence = (document.getElementById('filter2').value / 100) * d3.max(influenceLayers, function(d){
        return d3.max(d, function(d){
          return d3.max(d, function(d){
            return d.trueValue;
          })
        })
      });
      console.log(minInfluence);
      var upperLayerProportion = 0.60;
      var minConsumeValue = d3.max(consumeLayers, function(d){
        return d3.max(d, function(d){ return d.y; });
      }) * minConsumeProportion;
      var tmp = [];
      for(var i = 0; i < datetime.length; i++){
        for(var j = 0; j < layerNum; j++){
          var consumeValue = consumeLayers[j][i].y;
          var fullInfluenceValue = d3.sum(influenceLayers[j], function(d){
            return d[i].trueValue;
          });
          if(consumeValue >= minConsumeValue){
            consumeValue = consumeValue * upperLayerProportion;
            tmp.push(consumeValue/fullInfluenceValue);
          }
        }
      }
      var minValue = d3.min(tmp);

      for(var i = 0; i < consumeLayers.length; i++){
        for(var j = 0; j < consumeLayers[i].length; j++){
          if(consumeLayers[i][j].y < minConsumeValue){
            var _interval = consumeLayers[i][j].y / (upperlayerNum + 1);
            for(var k = 0; k < upperlayerNum; k++){
              influenceLayers[i][k][j]['y0'] = consumeLayers[i][j].y0 + (k+1)*_interval;
              influenceLayers[i][k][j].y = 0;
            }
          }
          else{
            var _interval = (consumeLayers[i][j].y  - d3.sum(influenceLayers[i], function(d){ return d[j].trueValue * minValue; })) / (upperlayerNum + 1);
            for(var k = 0; k < upperlayerNum; k++){
              if(k == 0){
                influenceLayers[i][k][j]['y0'] = consumeLayers[i][j].y0 + _interval;
              }
              else{
                influenceLayers[i][k][j]['y0'] = influenceLayers[i][k-1][j].y0 + influenceLayers[i][k-1][j].y + _interval;
              }
              if(influenceLayers[i][k][j].trueValue >= minInfluence){
                influenceLayers[i][k][j].y = influenceLayers[i][k][j].trueValue * minValue;
              }
              else{
                influenceLayers[i][k][j].y = 0;
              }
            }
          }
        }
      }
    }

  }

  console.log(el[0]);
  d3.json('data/influence.json', function(err, influence){
    console.log(el[0]);
    var myview = new overview(el[0]);
    myview.set_influence(influence);

    d3.json('data/consumeList.json', function(err, consume){
      myview.set_consume(consume);
      myview.render();
    });

  });  

  }
  return {
    link: link,
    restrict: 'E',
    scope: { data: '=' }
  };
});