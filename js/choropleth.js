/*
 * Choropleth - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data						-- the actual data: perDayData
 */

Choropleth = function (_parentElement, _data, _eventHandler) {
    this.parentElement = _parentElement;
    let {us, prisonData} = _data;
    this.us = us;
    this.prisonData = prisonData;
    this.eventHandler = _eventHandler;
    this.initVis();
}


/*
 * Initialize visualization (static content, e.g. SVG area or axes)
 */

Choropleth.prototype.initVis = function () {
    const vis = this;

    vis.margin = {top: 40, right: 0, bottom: 60, left: 60};


    vis.width = 1200 - vis.margin.left - vis.margin.right;
    vis.height = 600 - vis.margin.top - vis.margin.bottom;

    let path = d3.geoPath();

    let colorScale = d3.scaleSequential(d3.interpolateReds)
        .domain([0, 1])


    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    let test = topojson.feature(vis.us, vis.us.objects.counties).features
    vis.svg.append("g")
        .attr("class", "county")
        .selectAll("path")
        .data(topojson.feature(vis.us, vis.us.objects.counties).features)
        .enter().append("path")
        .attr("d", path)
        .style("fill", function (d) {
            let prisonData = vis.prisonData[`2015${d.id}`] || null;
            if (!prisonData) {
                return 'blue';
            }
            let total_incarcerated = (prisonData.total_prison_pop || 0) + (prisonData.total_jail_pop || 0)
            let total_pop = (prisonData.total_pop || 0)
            return colorScale(total_incarcerated / total_pop)
        })
}