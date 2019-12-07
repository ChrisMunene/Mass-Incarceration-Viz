Scatterplot = function (_parentElement, _data) {
    this.parentElement = _parentElement;
    this.schoolData = _data;
    this.wrangleData();

    console.log("data");
    console.log(this.schoolData);
};


Scatterplot.prototype.wrangleData = function() {
    var vis = this;

    vis.schoolData.forEach(function(d) {
        d.pct_suspended = +d.pct_suspended;
        d.pct_incarcerated = +d.pct_incarcerated;
    });

    vis.initVis();
}

Scatterplot.prototype.initVis = function() {
    var vis = this;
    // * TO-DO *

    vis.margin = {top: 40, right: 0, bottom: 60, left: 80};

    vis.width = 700 - vis.margin.left - vis.margin.right,
        vis.height = 600 - vis.margin.top - vis.margin.bottom;

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");



    // Scales and axes
    vis.x = d3.scaleLinear()
        .range([0, vis.width])
        .domain(d3.extent(vis.schoolData, function(d) {
                return d.pct_suspended;
            })
        );

    vis.y = d3.scaleLinear()
        .range([vis.height, 0])
        .domain([d3.min(vis.schoolData, function(d) {
            return d.pct_incarcerated;
        }), d3.max(vis.schoolData, function(d) {
            return d.pct_incarcerated;
        })/2]);

    vis.svg.append("text")
        .attr("transform", "translate(" + (vis.width/2) + "," + (vis.height + 35) + ")")
        .style("text-anchor", "middle")
        .text("Suspension rate per county");

    vis.yAxis = d3.axisLeft()
        .scale(vis.y);

    vis.xAxis = d3.axisBottom()
        .scale(vis.x);


    vis.svg.append("text")
        .attr("transform", "translate(-75, 0) rotate(-90)")
        .attr("y", 0)
        .attr("x",0 - (vis.height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Incarceration rate per county");

    vis.svg.append("g")
        .attr("class", "x-axis axis")
        .attr("transform", "translate(0," + vis.height + ")")
        .call(vis.xAxis);

    vis.svg.append("g")
        .attr("class", "y-axis axis")
        .call(vis.yAxis);

    //define trendline
    vis.linearRegression = d3.regressionLinear()
        .x(d => d.pct_suspended)
        .y(d => d.pct_incarcerated)
        .domain(d3.extent(vis.schoolData, function(d) {
            return d.pct_suspended;
        }));
    vis.regressionLine = vis.linearRegression(vis.schoolData);

    vis.line = d3.line()
        .x(d => vis.x(d[0]))
        .y(d => vis.y(d[1]));


    //tooltip on mouseover
    vis.tooltip = d3.tip()
        .attr('class', 'tooltip')
        .html(function(d) {
            return "<span><strong>County name: " + d.county_name + "</strong></span><br><span>Percent suspended: " + d3.format(",.2f")(d.pct_suspended*100)
                + "%</span><br><span>Percent incarcerated: " + d3.format(",.2f")(d.pct_incarcerated*100) + "%</span>";}
            );

    vis.svg.call(vis.tooltip);

    vis.svg.selectAll(".point")
        .data(vis.schoolData)
        .enter()
        .append("circle")
        .attr("class", "point")
        .attr("r", 3)
        .attr("cx", function(d) {
            return vis.x(d.pct_suspended);
        })
        .attr("cy", function(d) {
            return vis.y(d.pct_incarcerated);
        })
        .on('mouseover', vis.tooltip.show)
        .on('mouseout', vis.tooltip.hide);

    //draw trendline (over points)
    vis.svg.append("path")
        .datum(vis.regressionLine)
        .attr("id", "trendline")
        .attr("d", vis.line)
        .style("stroke", "steelblue")
        .style("stroke-width", "2px");
};