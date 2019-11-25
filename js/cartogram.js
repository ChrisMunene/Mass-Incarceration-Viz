/*
 * CountVis - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data						-- the actual data: perDayData
 */

Cartogram = function (_parentElements, _data, _eventHandler) {
    this.parentElements = _parentElements;
    this.data = _data;
    //this.eventHandler =
    this.stage = 0;
    this.zeroData = _.cloneDeep(this.data);
    _.each(this.zeroData.world, country => {
        if (country['Title'] == 'United States of America') {
            country['Prison Population Total'] = 0
        }
    });

    this.initVis();
}


/*
 * Initialize visualization (static content, e.g. SVG area or axes)
 */

Cartogram.prototype.initVis = function () {

    const vis = this;

    vis.margin = {top: 40, right: 0, bottom: 60, left: 60};

    vis.colorScale = d3.scaleSequential(d3.interpolateReds)
        .domain([0, 800]);



    vis.width = 1000 - vis.margin.left - vis.margin.right,
        vis.height = 800 - vis.margin.top - vis.margin.bottom;

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElements[0]).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    vis.otherSvg = d3.select("#" + vis.parentElements[1]).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right - 660)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    vis.usCircle = vis.svg.append("g")
        .attr("class", "us-circle-group")
        .attr("transform", "translate(" + '300' + "," + '300' + ")");

    vis.otherCircles = vis.otherSvg.append("g")
        .attr("class", "other-circles-group")
        .attr("transform", "translate(" + '0' + "," + '0' + ")");


    vis.x = d3.scaleLinear()
        .range([0, 100000])
        .domain([0, d3.max(_.map(vis.data.world), country => {
            return country['Prison Population Total']
        })]);

    vis.scale = d3.scaleLinear() // v4
        .domain([0, 1000])
        .range([0, 300]);  // clipped
    vis.svg.append("text")
        .attr("x", 0)
        .attr("y", 25)
        .text("Incarceration Rate Per 100,000")
    var axisGroup = vis.svg.append("g").attr("transform", "translate(0,50)")
    var axis = d3.axisTop() // v4
        .scale(vis.scale )
    var axisNodes = axisGroup.call(axis);
    let scaleRange = _.range(300);
    vis.svg.selectAll("color-scale")
        .data(scaleRange)
        .enter()
        .append("rect")
        .attr("class", "color-scale")
        .attr("x", d=>{
            return d;
        })
        .attr("y", 55)
        .attr("width", 1)
        .attr("height", 10)
        .attr("fill", d=>{
            let val = vis.scale.invert(d);
            return vis.colorScale(val)
        })
    vis.wrangleData()
}


/*
 * Data wrangling
 */

Cartogram.prototype.wrangleData = function () {
    var vis = this;
    vis.displayData = vis.data;


    vis.stage++;
    if (vis.stage % 3 === 1) {
        vis.displayData = vis.data
    } else if (vis.stage % 3 === 2) {
        vis.displayData = vis.zeroData;
    } else {
        vis.displayData = vis.data;
    }
    vis.usData = _.find(vis.displayData.world, country => {
        return country['Title'] == 'United States of America'
    });
    vis.otherCountries = ['China', 'Mexico', 'France', 'Canada'];
    vis.otherCountryData = _.filter(vis.displayData.world, country => {
        return _.includes(vis.otherCountries, country['Title'])
    });

    if (vis.stage % 3 === 1) {
        vis.updateVis();
    } else if (vis.stage % 3 === 2) {
        vis.updateVis();
        vis.growMap()
        vis.drawMap()
    }

}


/*
 * The drawing function - should use the D3 update sequence (enter, update, exit)
 * Function parameters only needed if different kinds of updates are needed
 */

Cartogram.prototype.updateVis = function () {
    var vis = this;

    let usCircle = vis.usCircle.selectAll(".us-circle")
        .data([vis.usData]);

    usCircle.enter().append("circle")
        .merge(usCircle)
        .transition()
        .attr("class", "us-circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", d => {
            return Math.sqrt(vis.x(d['Prison Population Total']) / Math.PI)
        })
        .attr("fill", d => {
            return vis.colorScale(d['Prison Population Rate'])
        })

    usCircle.exit().remove()

    let countryLabel = vis.usCircle.selectAll(".us-country-label")
        .data([vis.usData]);
    countryLabel.enter().append("text")
        .merge(countryLabel)
        .attr("class", "us-country-label")
        .attr("x", 0)
        .attr("y", d=>{
            return -Math.sqrt(vis.x(d['Prison Population Total']) / Math.PI) - 30
        })
        .attr("text-anchor", "middle")
        .text(d => {
            return d['Title']
        })
        .attr("opacity", d => {
            return d['Prison Population Total']
        });
    countryLabel.exit().remove()

    let populationLabel = vis.usCircle.selectAll(".us-population-label")
        .data([vis.usData]);

    populationLabel.enter().append("text")
        .merge(populationLabel)
        .attr("x", 0)
        .attr("y", d=>{
            return -Math.sqrt(vis.x(d['Prison Population Total']) / Math.PI) - 10
        })
        .attr("class", "us-population-label")
        .attr("text-anchor", "middle")
        .text(d => {
            return `Prison Population: ${d['Prison Population Total']}`
        })
        .attr("opacity", d => {
            return d['Prison Population Total']
        });
    populationLabel.exit().remove()


    let otherCircles = vis.otherCircles.selectAll(".other-circles")
        .data(vis.otherCountryData)

    otherCircles.enter().append("circle")
        .merge(otherCircles)
        .transition()
        .attr("class", "other-circles")
        .attr("cx", d => {
            let index = _.indexOf(vis.otherCountries, d['Title'])
            return (index % 2) * 300 + 100
        })
        .attr("cy", d => {
            let index = _.indexOf(vis.otherCountries, d['Title']);
            return Math.floor(index / 2) * 300 + 200
        })
        .attr("r", d => {
            return Math.sqrt(vis.x(d['Prison Population Total']) / Math.PI)
        })
        .attr("fill", d => {
            return vis.colorScale(d['Prison Population Rate'])
        })
    otherCircles.exit().remove()


    let otherCountryLabels = vis.otherSvg.selectAll(".other-country-labels")
        .data(vis.otherCountryData)

    otherCountryLabels.enter().append("text")
        .merge(otherCountryLabels)
        .attr("class", "other-country-labels")
        .attr("x", d => {
            let index = _.indexOf(vis.otherCountries, d['Title'])
            return (index % 2) * 300 + 100
        })
        .attr("y", d => {
            let index = _.indexOf(vis.otherCountries, d['Title']);
            return Math.floor(index / 2) * 300 + 200 - Math.sqrt(vis.x(d['Prison Population Total']) / Math.PI) - 25
        })
        .attr("text-anchor", "middle")
        .text(d => {
            return d['Title']
        })
        .attr("opacity", d => {
            return d['Prison Population Total']
        });
    otherCountryLabels.exit().remove();

    let otherCountryPopulationLabels = vis.otherSvg.selectAll(".other-country-population-labels")
        .data(vis.otherCountryData)

    otherCountryPopulationLabels.enter().append("text")
        .merge(otherCountryPopulationLabels)
        .attr("class", "other-country-population-labels")
        .attr("x", d => {
            let index = _.indexOf(vis.otherCountries, d['Title'])
            return (index % 2) * 300 + 100
        })
        .attr("y", d => {
            let index = _.indexOf(vis.otherCountries, d['Title']);
            return Math.floor(index / 2) * 300 + 200 - Math.sqrt(vis.x(d['Prison Population Total']) / Math.PI) - 10
        })
        .attr("text-anchor", "middle")
        .text(d => {
            return 'Prison Population:' + d['Prison Population Total']
        })
        .attr("opacity", d => {
            return d['Prison Population Total']
        });

    otherCountryPopulationLabels.exit().remove();


};

Cartogram.prototype.growMap = function () {
    const vis = this;
    vis.width = 1200;
    // $(`#${vis.parentElements[0]} svg`).width(1200);
    // $(`#${vis.parentElements[1]} svg`).width(0);
    vis.neighbors = topojson.neighbors(vis.data.us.objects.states.geometries);
    vis.nodes = topojson.feature(vis.data.us, vis.data.us.objects.states).features;
    var projection = d3.geoAlbersUsa()
        .scale([100]);          // scale things down so see entire US

// Define path generator
    var path = d3.geoPath()               // path generator that will convert GeoJSON to SVG paths
        .projection(projection);  // tell path generator to use albersUsa projection


    vis.nodes.forEach(function (node, i) {

        var centroid = d3.geoPath().centroid(node);

        node.x0 = centroid[0];
        node.y0 = centroid[1];

        cleanUpGeometry(node);

    });

    var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function (d) {
            let stateName = vis.data.fipsToState[d.id]
            let stateData = _.find(vis.data.state, state => {
                return _.trim(stateName) == _.trim(state['State'])
            })
            return `<div class="tool-tip"><strong>${stateName}</strong><br>
                    <table class="table table-borderless">
                      <tbody>
                        <tr>
                          <td>In Prison/Jail</td>
                          <td>${stateData['Total']}</td>
                        </tr> 
                        <tr>
                          <td>Incarceration Rate per 100,000 adults</td>
                          <td>${stateData['Rate Per 100000 Adult']}</td>
                        </tr>
                        </tbody>
                        </table>
                    <div>`
        })

    vis.svg.call(tip);

    vis.states = vis.svg.selectAll("path")
        .data(vis.nodes)
        .enter()
        .append("path")
        .attr("class", "state-circles")
        .attr("d", pathString)
        .attr("fill", d=>{
            let stateName = vis.data.fipsToState[d.id]
            let stateData = _.find(vis.data.state, state => {
                return _.trim(stateName) == _.trim(state['State'])
            })
            return vis.colorScale(stateData['Rate Per 100000 All Ages'])

        })
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide)


}
Cartogram.prototype.drawMap = function () {
    const vis = this;
    simulate();

    function simulate() {
        vis.nodes.forEach(function (node) {
            node.x = node.x0;
            node.y = node.y0;
            let stateName = vis.data.fipsToState[node.id]
            let stateData = _.find(vis.data.state, state => {
                return _.trim(stateName) == _.trim(state['State'])
            })

            node.r = Math.sqrt(vis.x(stateData['Total']) / Math.PI)
        });


        let links = d3.merge(vis.neighbors.map(function (neighborSet, i) {
            return neighborSet.filter(j => vis.nodes[j]).map(function (j) {
                return {source: i, target: j, distance: vis.nodes[i].r + vis.nodes[j].r + 3};
            });
        }));

        var simulation = d3.forceSimulation(vis.nodes)
            .force("cx", d3.forceX().x(d => vis.width / 2).strength(0.02))
            .force("cy", d3.forceY().y(d => vis.height / 2).strength(0.02))
            .force("link", d3.forceLink(links).distance(d => d.distance))
            .force("x", d3.forceX().x(d => d.x).strength(0.1))
            .force("y", d3.forceY().y(d => d.y).strength(0.1))
            .force("collide", d3.forceCollide().strength(0.8).radius(d => d.r + 3))
            .stop();

        while (simulation.alpha() > 0.1) {
            simulation.tick();
        }

        vis.nodes.forEach(function (node) {
            var circle = pseudocircle(node),
                closestPoints = node.rings.slice(1).map(function (ring) {
                    var i = d3.scan(circle.map(point => distance(point, ring.centroid)));
                    return ring.map(() => circle[i]);
                }),
                interpolator = d3.interpolateArray(node.rings, [circle, ...closestPoints]);

            node.interpolator = function (t) {
                var str = pathString(interpolator(t));
                // Prevent some fill-rule flickering for MultiPolygons
                if (t > 0.99) {
                    return str.split("Z")[0] + "Z";
                }
                return str;
            };
        });

        vis.states
            .sort((a, b) => b.r - a.r)
            .transition()
            .duration(0)
            .attrTween("d", node => node.interpolator)
            .attr("class", "state-circles")

        // .on("end", (d, i) => i );

    }

};

function pseudocircle(node) {
    return node.rings[0].map(function (point) {
        var angle = node.startingAngle - 2 * Math.PI * (point.along / node.perimeter);
        return [
            Math.cos(angle) * node.r + node.x,
            Math.sin(angle) * node.r + node.y
        ];
    });
}

function cleanUpGeometry(node) {

    node.rings = (node.geometry.type === "Polygon" ? [node.geometry.coordinates] : node.geometry.coordinates);

    node.rings = node.rings.map(function (polygon) {
        polygon[0].area = d3.polygonArea(polygon[0]);
        polygon[0].centroid = d3.polygonCentroid(polygon[0]);
        return polygon[0];
    });

    node.rings.sort((a, b) => b.area - a.area);

    node.perimeter = d3.polygonLength(node.rings[0]);

    // Optional step, but makes for more circular circles
    bisect(node.rings[0], node.perimeter / 72);

    node.rings[0].reduce(function (prev, point) {
        point.along = prev ? prev.along + distance(point, prev) : 0;
        node.perimeter = point.along;
        return point;
    }, null);

    node.startingAngle = Math.atan2(node.rings[0][0][1] - node.y0, node.rings[0][0][0] - node.x0);

}

function bisect(ring, maxSegmentLength) {
    for (var i = 0; i < ring.length; i++) {
        var a = ring[i], b = i === ring.length - 1 ? ring[0] : ring[i + 1];

        while (distance(a, b) > maxSegmentLength) {
            b = midpoint(a, b);
            ring.splice(i + 1, 0, b);
        }
    }
}

function distance(a, b) {
    return Math.sqrt((a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1]));
}

function midpoint(a, b) {
    return [a[0] + (b[0] - a[0]) * 0.5, a[1] + (b[1] - a[1]) * 0.5];
}

function pathString(d) {
    return (d.rings || d).map(ring => "M" + ring.join("L") + "Z").join(" ");
}