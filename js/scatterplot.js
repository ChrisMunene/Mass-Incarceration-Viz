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

    console.log("vis.schoolData")
    console.log(vis.schoolData);

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

    console.log("extent of suspension data");
    console.log([d3.min(vis.schoolData, function(d) {
        // console.log(d.pct_suspended);
        return d.pct_incarcerated;
    }), d3.max(vis.schoolData, function(d) {
        // console.log(d.pct_suspended);
        return d.pct_incarcerated;
    })/2]);

    vis.x = d3.scaleLinear()
        .range([0, vis.width])
        .domain(d3.extent(vis.schoolData, function(d) {
                // console.log(d.pct_suspended);
                return d.pct_suspended;
            })
        );

    vis.y = d3.scaleLinear()
        .range([vis.height, 0])
        .domain([d3.min(vis.schoolData, function(d) {
            // console.log(d.pct_suspended);
            return d.pct_incarcerated;
        }), d3.max(vis.schoolData, function(d) {
            // console.log(d.pct_suspended);
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

    // vis.rotateTranslate = d3.svg.transform().rotate(-90).translate(-20, 0);
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

    //
    // var xSeries = d3.range(1, xLabels.length + 1);
    // var ySeries = data.map(function(d) { return parseFloat(d['rate']); });
    //
    // var leastSquaresCoeff = leastSquares(xSeries, ySeries);
    //
    // // apply the reults of the least squares regression
    // var x1 = xLabels[0];
    // var y1 = leastSquaresCoeff[0] + leastSquaresCoeff[1];
    // var x2 = xLabels[xLabels.length - 1];
    // var y2 = leastSquaresCoeff[0] * xSeries.length + leastSquaresCoeff[1];
    // var trendData = [[x1,y1,x2,y2]];
    //
    // var trendline = svg.selectAll(".trendline")
    //     .data(trendData);
    //
    // trendline.enter()
    //     .append("line")
    //     .attr("class", "trendline")
    //     .attr("x1", function(d) { return xScale(d[0]); })
    //     .attr("y1", function(d) { return yScale(d[1]); })
    //     .attr("x2", function(d) { return xScale(d[2]); })
    //     .attr("y2", function(d) { return yScale(d[3]); })
    //     .attr("stroke", "black")
    //     .attr("stroke-width", 1);

    // vis.linearRegression = ƒ(vis.schoolData);
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

    vis.svg.append("path")
        .datum(vis.regressionLine)
        .attr("d", vis.line)
        .style("stroke", "steelblue")
        .style("stroke-width", "2px");


    //tooltip on mouseover
    vis.tooltip = d3.tip()
        .attr('class', 'tooltip')
        .html(function(d) {
            return "<span>Percent suspended: " + d3.format(",.2f")(d.pct_suspended*100)
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
};