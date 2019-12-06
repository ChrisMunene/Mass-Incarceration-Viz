/*
 * Choropleth - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data						-- the actual data: perDayData
 */

Choropleth = function (_parentElement, _data, _eventHandler) {
    this.parentElement = _parentElement;
    let {us, fips, choroData} = _data;
    this.us = us;
    this.initData = choroData;
    this.fips = fips;
    this.eventHandler = _eventHandler;
    this.initVis();
}


/*
 * Initialize visualization (static content, e.g. SVG area or axes)
 */

Choropleth.prototype.initVis = function () {
    const vis = this;

    vis.selected = 'ISS'; //default

    vis.choroData = vis.initData[vis.selected];

    vis.domains = {
        ISS: 17.6,
        OOS: 16.8,
        TRANSF: 1.16,
        EXP: 0.74,
        EXPZT: 0.55,
        REF: 3.2,
        ARREST: 0.9
    }


    vis.margin = {top: 40, right: 0, bottom: 60, left: 60};


    vis.width = 1000 - vis.margin.left - vis.margin.right;
    vis.height = 432 - vis.margin.top - vis.margin.bottom;


// Define path generator
    vis.path = d3.geoPath()           // path generator that will convert GeoJSON to SVG paths

    vis.colorScale = d3.scaleSequential(d3.interpolateReds)


    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");


    vis.tip = d3.tip()
        .attr('class', 'tooltip')
        .offset([20, 0])
        .html(function (d) {
                var thisstate = vis.fips[d.id]

                var thisdata = vis.choroData.filter(d => d.State == thisstate);

                var percentdata = thisdata[0][vis.race] * 100

                return "<span>State: " + thisstate + "</span><br><span>Percent: " + d3.format(",.2f")(percentdata) + "%</span>";
            }
        );

    vis.svg.call(vis.tip);


    vis.scale1 = d3.scaleLinear() // v4
        .domain([0, vis.curdomain])
        .range([0, 300]);  // clipped

    vis.scale2 = d3.scaleLinear() // v4
        .domain([vis.curdomain,0])
        .range([0, 300]);  // clipped


    vis.legy = 350
    vis.legx = 730
    vis.legw = 20
    vis.labelx = vis.legx+vis.legw+30
    vis.labely = vis.legy-300.5


    vis.axis = d3.axisRight().scale(vis.scale2).tickFormat(d => d + "%");

    vis.svg.append("g")
        .attr("class","color axis")
        .attr("transform","translate("+vis.labelx+","+vis.labely+")")
        .call(vis.axis);

    vis.updateVis()


}

Choropleth.prototype.updateVis = function(){
    var vis = this;

    vis.choroData = vis.initData[vis.selected];

    vis.curdomain = vis.domains[vis.selected]

    vis.colorScale.domain([0, vis.curdomain])


    vis.usMapGroup = vis.svg.append("g")
        .attr("class", "state")

    vis.usMap = vis.usMapGroup.selectAll("path").data(topojson.feature(vis.us, vis.us.objects.states).features)
    vis.usMap.enter().append("path")
        .attr("d", vis.path)
        .style("fill", function (d) {
            this.thisstate = vis.fips[d.id]

            this.thisdata = vis.choroData.filter(d => d.State == this.thisstate);

            this.percentdata = this.thisdata[0][vis.race] * 100
            if(isNaN(this.percentdata) || vis.clicked==false ){
                return "#d0d0d0"
            }
            return vis.colorScale(this.percentdata)

        })
        .on('mouseover', function(d){
            if(!isNaN(this.percentdata) && vis.clicked==true ){
                d3.select(this).style("stroke", "black").style("stroke-width", 2);
                return vis.tip.show(d)
            }
        })
        .on('mouseout', function(d) {
            if(!isNaN(this.percentdata) && vis.clicked==true ) {
                d3.select(this).style("stroke", "rgba(149,149,149,0.29)").style("stroke-width", 1);
                return vis.tip.hide(d)
            }
        })
        .attr("transform", "scale(0.72) translate("+100+",-50)")
        .style("stroke", "rgba(149,149,149,0.29)")


    vis.scale1.domain([0, vis.curdomain])
    vis.scale2.domain([vis.curdomain,0])


    vis.svg.select(".color")
        .transition()
        .call(vis.axis);


    var scaleRange = _.range(300);
    vis.colorlegend = vis.svg.selectAll(".color-scale").data(scaleRange)

    vis.colorlegend.enter().append("rect")
        .merge(vis.colorlegend)
        .attr("class", "color-scale")
        .attr("x", d => {
            return d;
        })
        .attr("y", 25)
        .attr("width", 1)
        .attr("height", vis.legw)
        .attr("fill", d => {
            let val = vis.scale1.invert(d);
            return vis.colorScale(val)
        })
        .attr("transform",'translate('+vis.legx+','+vis.legy+') rotate(-90)');

    vis.colorlegend.exit().remove();

    // vis.titlelabel = vis.svg.selectAll(".titletext").data([vis.race+"\n"+vis.selected]);
    //
    // vis.titlelabel.enter().append("text")
    //     .merge(vis.titlelabel)
    //     .attr("class","titletext")
    //     .attr("text-anchor", "left")
    //     .attr("fill", "black")
    //     .attr("x",20)
    //     .attr("y",-8)
    //     .text(function(d,idx){
    //         return d
    //     });
    // vis.titlelabel.exit().remove();


}
Choropleth.prototype.dropdownChanged = function(){
    var vis = this;
    vis.clicked = false;
    vis.updateVis()
}

Choropleth.prototype.onSelectionChange = function(race, selected, clicked){
    var vis = this;
    if(race=='Native American'){
        race = 'NA'
    }
    if(race=='Pacific Islander'){
        race = 'Pacific'
    }
    vis.race = race
    vis.selected = selected
    vis.clicked = clicked
    console.log('selectionchange clicked',vis.clicked)
    vis.updateVis();
}