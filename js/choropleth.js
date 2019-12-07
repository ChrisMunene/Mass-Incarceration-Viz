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


    vis.margin = {top: 30, right: 0, bottom: 60, left: 60};


    vis.width = $(window).width()*(0.75) - vis.margin.left - vis.margin.right;
    vis.height = ($(window).height()-$('#view-type').height())*(0.65) - vis.margin.top - vis.margin.bottom;


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
        .offset([0, 0])
        .html(function (d) {
                var thisstate = vis.fips[d.id]

                var thisdata = vis.choroData.filter(d => d.State == thisstate);

                var percentdata = thisdata[0][vis.race] * 100

                return "<span>State: " + thisstate + "</span><br><span>Percent: " + d3.format(",.2f")(percentdata) + "%</span>";
            }
        );

    vis.svg.call(vis.tip);


    vis.legheight = 260
    vis.scale1 = d3.scaleLinear() // v4
        .domain([0, vis.curdomain])
        .range([0, vis.legheight]);  // clipped

    vis.scale2 = d3.scaleLinear() // v4
        .domain([vis.curdomain,0])
        .range([0, vis.legheight]);  // clipped


    vis.legy = 280
    vis.legx = 660
    vis.legw = 20
    vis.labelx = vis.legx+vis.legw+30
    vis.labely = vis.legy-vis.legheight


    vis.usMapGroup = vis.svg.append("g")
        .attr("class", "usmap")

    vis.legend = vis.svg.append("g")
        .attr("class", "color-legend")

    vis.axis = d3.axisRight().scale(vis.scale2).tickFormat(d => d + "%");

    vis.svg.append("g")
        .attr("class","color-axis")
        .attr("transform","translate("+vis.labelx+","+vis.labely+")")
        .call(vis.axis);


    vis.svg.append("text")
        .attr("class","cta-text")
        .attr("text-anchor", "left")
        .attr("fill", "#676767")
        .attr("x",vis.width*(0.2)+35)
        .attr("y",125)
        .text("Click on race bar to see geographic breakdown");

    vis.updateVis()


}

Choropleth.prototype.updateVis = function(){
    var vis = this;

    vis.choroData = vis.initData[vis.selected];

    vis.curdomain = vis.domains[vis.selected]

    vis.colorScale.domain([0, vis.curdomain])


    vis.mapx = vis.width*(0.3)

    if(vis.clicked!=true){
        d3.selectAll(".color-legend").style("opacity", 0);
        d3.selectAll(".color-axis").style("opacity", 0);
        d3.selectAll(".cta-text").style("opacity", 1);
    }
    else{
        d3.selectAll(".color-legend").style("opacity", 1);
        d3.selectAll(".color-axis").style("opacity", 1);
        d3.selectAll(".cta-text").style("opacity", 0);
    }


    vis.usMap = vis.usMapGroup.selectAll(".state").data(topojson.feature(vis.us, vis.us.objects.states).features)

    vis.usMap.enter().append("path")
        .merge(vis.usMap)
        .attr("class","state")
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
        .style("opacity",function(d){
            if(isNaN(this.percentdata) || vis.clicked==false ){
                return 0.6
            }
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
        .attr("transform", "scale(0.55) translate("+vis.mapx+",-50)")
        .style("stroke", "rgba(149,149,149,0.29)")

    vis.usMap.exit().remove();


    vis.scale1.domain([0, vis.curdomain])
    vis.scale2.domain([vis.curdomain,0])


    vis.svg.select(".color-axis")
        .transition()
        .call(vis.axis);



    var scaleRange = _.range(vis.legheight);
    vis.colorlegend = vis.legend.selectAll(".color-legend-unit").data(scaleRange)

    vis.colorlegend.enter().append("rect")
        .merge(vis.colorlegend)
        .attr("class", "color-legend-unit")
        .attr("x", d => {
            return d;
        })
        .attr("y", 25)
        .attr("width", 1)
        .attr("height", vis.legw)
        .attr("fill", d => {
            var val = vis.scale1.invert(d);
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