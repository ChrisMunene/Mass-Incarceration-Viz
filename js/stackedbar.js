
// SVG drawing area
BarVis = function(_parentElement, _data, _eventHandler ){
	this.parentElement = _parentElement;
	this.data = _data;
	this.eventHandler =_eventHandler;

	this.initVis();
}

// References
// https://observablehq.com/@d3/stacked-bar-chart
// https://bl.ocks.org/romsson/8aea86fddcf01380eb96a341509f394f
// https://bl.ocks.org/LemoNode/5a64865728c6059ed89388b5f83d6b67

BarVis.prototype.initVis = function() {
	var vis = this;

	vis.margin = {top: 30, right: 150, bottom: 30, left: 150};

	vis.width = $(window).width()*(0.75) - vis.margin.left - vis.margin.right;
	vis.height = ($(window).height()-$('#view-type').height())*(0.35) - vis.margin.top - vis.margin.bottom;

	vis.svg = d3.select("#bar-vis").append("svg")
		.attr("width", vis.width + vis.margin.left + vis.margin.right)
		.attr("height", vis.height + vis.margin.top + vis.margin.bottom)
		.append("g")
		.attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

// Scales and axes
	vis.x = d3.scaleBand()
		.rangeRound([0, vis.width])
		.paddingInner(0.2);

	vis.y = d3.scaleLinear()
		.range([vis.height, 0]);

	vis.xAxisBar = d3.axisBottom().scale(vis.x);
	vis.yAxisBar = d3.axisLeft().scale(vis.y).tickFormat(d => d + "%").ticks(5);


	vis.my_xaxis = vis.svg.append("g")
		.attr("class", "axis x-axis")
		.attr("transform", "translate(0," + (vis.height) + ")");

	vis.my_yaxis = vis.svg.append("g")
		.attr("class", "axis y-axis")
		.attr("transform", "translate(" + 0 + ",0)");

	vis.svg.append("text")
		.attr("class", "axis x-axis")
		.attr("transform", "rotate(-90) translate(0, -35)")
		.attr("y", -35)
		.attr("x",0 - (vis.height / 2))
		.attr("dy", "1em")
		.style("text-anchor", "middle")
		.text("Percent of Students");


	vis.legendx = 10;
	vis.legendy = -29;
	vis.blockdim = vis.height*(0.12);

	vis.legend = vis.svg.selectAll("rect").data(["#1E1EC5", "firebrick"]);

	vis.legend.enter().append("rect")
		.attr("class", "legend")
		.attr('width', vis.blockdim)
		.attr('height', vis.blockdim)
		.style('fill', function (d, idx) {
			return d;
		})
		.attr("x", vis.legendx)
		.attr("y", vis.legendy)
		.attr("transform", function (d, idx) {
			return 'translate(' + ((idx * 100) + 20) + ',0)';
		});

	vis.legendlabels = vis.svg.selectAll(".legend_labels").data(["Male", "Female"]);

	vis.legendlabels.enter().append("text")
		.merge(vis.legendlabels)
		.attr("class", "legend_labels")
		.attr("text-anchor", "left")
		.attr("fill", "black")
		.attr("x", vis.legendx)
		.attr("y", vis.legendy + vis.blockdim - 6)
		.attr("transform", function (d, idx) {
			return 'translate(' + ((idx * 100) + 48) + ',0)';
		})
		.text(function (d, idx) {
			return d;
		});

	vis.legendlabels.exit().remove();


	vis.sorted;

// Initialize data
	vis.updateVisualization()
}


BarVis.prototype.sortButton = function (){
	var vis = this;
	if(vis.sorted){
		vis.sorted = false;
		$('#sort-button').toggleClass('active');
	}
	else{
		vis.sorted = true;
		$('#sort-button').toggleClass('active');
	}

	vis.updateVisualization();
}
BarVis.prototype.dropdownChanged = function () {
	vis=this;
	vis.clicked=false
	$(vis.eventHandler).trigger("selectionChanged", [0, vis.selected, vis.clicked]);
	vis.updateVisualization()
}

// Render visualization
BarVis.prototype.updateVisualization = function (){

	var vis = this;
	vis.selected = d3.select("#view-type").property("value");
	vis.newdata = vis.data[vis.selected];
	vis.filterdata = [...vis.newdata];

	if(vis.sorted){
		vis.filterdata = vis.filterdata.sort(function(a, b) { return b.Total - a.Total; });
	}
	else{
	}

	vis.columns = d3.keys(vis.filterdata[0])

	//Set scales
	vis.x.domain(vis.filterdata.map(function(d) { return d.Race; }));
	vis.y.domain([0 , d3.max(vis.filterdata, function(d) {return d.Total }) ]);


	vis.series = d3.stack().keys(vis.columns.slice(1,3))(vis.filterdata)

	vis.layergroup = vis.svg.selectAll(".layer").data(vis.series)


	vis.layergroup.enter()
		.append("g")
		.attr("class", "layer")
		.attr("fill", function(d) {
			if(d.key=="Male") {
				return "#1E1EC5";
			}
			else{
				return "firebrick";
			}})


	vis.sections = vis.svg.selectAll(".layer").selectAll(".bar").data(function(d) { return d;})

	vis.sections.enter()
		.append("rect")
		.attr("class","bar")
		.on("click",function(d){
			if(vis.clicked){
				vis.clicked=false
			}
			else{
				vis.clicked = true;
				var thisrace = d.data.Race
				d3.selectAll(".bar").style("opacity", function(d){
					if(d.data.Race != thisrace){
						return 0.7;
					}
					if(d.data.Race == thisrace){
						return 1;
					}
				})
			}
			$(vis.eventHandler).trigger("selectionChanged", [d.data.Race, vis.selected, vis.clicked]);

		})
		.on("mouseover",function(d){
			if(vis.clicked!=true) {
				var thisrace = d.data.Race
				d3.selectAll(".bar").style("opacity", function (d) {
					if (d.data.Race != thisrace) {
						return 0.7;
					}
				})
			}
		})
		.on("mouseout",function(d){
			if(vis.clicked!=true) {
				var thisrace = d.data.Race
				d3.selectAll(".bar").style("opacity", function (d) {
					if (d.data.Race != thisrace) {
						return 1;
					}
				})
			}
		})
		.merge(vis.sections)
		.transition()
		.duration(800)
		.attr("x", function(d) { return vis.x(d.data.Race)+10; })
		.attr("y", function(d) { return vis.y(d[1]); })
		.attr("width", vis.x.bandwidth()-20)
		.attr("height", function(d) { return vis.y(d[0]) - vis.y(d[1]); })

	vis.sections.exit().remove();


	//Update Axes
	vis.svg.select(".y-axis")
		.transition()
		.duration(500)
		.call(vis.yAxisBar)


	vis.svg.select(".x-axis")
		.call(vis.xAxisBar)
		.selectAll("text")
		.transition()
		.duration(500)


}
