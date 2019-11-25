/*
 * Matrix - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the area chart
 * @param _data			    -- the dataset 'families'
 * @param _marriages		-- marriages adjacency matrix
 * @param _business_ties    -- business adjacency matrix
 */

Matrix = function(_parentElement, _data, _size, _eventHandler) {
  this.parentElement = _parentElement;
  this.data = _data;
  this.size = _size;
  this.selectedRange = null;
  this.eventHandler = _eventHandler;
  this.actual_value = 14;
  this.displayData = [];

  this.initVis();
};

/*
 * Initialize visualization (static content; e.g. SVG area, axes)
 */

Matrix.prototype.initVis = function() {
  var vis = this;

  // Margins
  vis.margin = { top: 20, right: 20, bottom: 20, left: 20 };

  (vis.width = 540 - vis.margin.left - vis.margin.right),
    (vis.height = 540 - vis.margin.top - vis.margin.bottom);

  // SVG drawing area
  vis.svg = d3
    .select("#" + vis.parentElement)
    .append("svg")
    .attr("width", vis.width + vis.margin.left + vis.margin.right)
    .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
    .style("margin-left", -vis.margin.left + "px")
    .append("g")
    .attr(
      "transform",
      "translate(" + vis.margin.left + "," + vis.margin.top + ")"
    );

  // Scales
  vis.x = d3
    .scaleBand()
    .domain(d3.range(vis.size))
    .rangeRound([0, vis.width])
    .paddingInner(0.2);

  vis.y = d3
    .scaleBand()
    .domain(d3.range(vis.size))
    .rangeRound([0, vis.height])
    .paddingInner(0.2);

  // (Filter, aggregate, modify data)
  vis.wrangleData();
};

/*
 * Data wrangling
 */

Matrix.prototype.wrangleData = function() {
  var vis = this;

  // Merge datasets and Calculate relationships
  var count = 0;
  d3.range(vis.size).forEach((array, index) => {
    vis.displayData.push(
      d3.range(vis.size).map((d, i) => {
        count += 1;
        return count;
      })
    );
  });
  // Update the visualization
  vis.updateVis();
};

/*
 * The drawing function
 */

Matrix.prototype.updateVis = function() {
  var vis = this;
  // Rows
  vis.row = vis.svg
    .selectAll(".row")
    .data(vis.displayData)
    .enter()
    .append("g")
    .attr("class", "row")
    .attr("transform", function(d, i) {
      return "translate(0," + vis.y(i) + ")";
    });

  // Create circles
  vis.circles = vis.row
    .selectAll(".circle")
    .data(function(d) {
      return d;
    })
    .enter()
    .append("circle")
    .attr("class", "circle")
    .attr("cx", (d, i) => vis.x(i))
    .attr("r", (d, i) => vis.x.bandwidth() / 2)
    .attr("stroke-width", 1)
    .attr("stroke", "black")
    .attr("fill", "white");

  if (vis.selectedRange == null) {
    vis.circles.on("mouseover", val => {
      var perc_selected = (val / Math.pow(vis.size, 2)) * 100;
      $("#interactive-text").text(
        `You have selected ${val}M individuals (${perc_selected.toFixed(
          2
        )}%) of the population`
      );
      d3.selectAll(".row")
        .selectAll(".circle")
        .attr("fill", (d, i) => (d <= val ? "blue" : "white"));
    });

    vis.circles.on("click", val => {
      var perc_selected = (val / Math.pow(vis.size, 2)) * 100;

      $("#interactive-text").text(
        `You have selected ${perc_selected.toFixed(
          2
        )}% of the population(${val}M individuals)`
      );

      // Transition to next page

      $(vis.eventHandler).trigger("selectionChanged", val);
      vis.circles.on("mouseover", null);
      vis.circles.on("click", null);
    });
  }
};

/*
 * The sorting function
 */
Matrix.prototype.setSelectedRange = function(value) {
  var vis = this;
  vis.selectedRange = value;
  var perc_selected = (
    (vis.selectedRange / Math.pow(vis.size, 2)) *
    100
  ).toFixed(2);
  var real_perc = 4.4;
  var diff = perc_selected - real_perc;
  $("#selection-result").html(
    `<ul>
<li>You have selected ${perc_selected}% of the population(${
      vis.selectedRange
    }M individuals)</li>
<li>You ${
      diff > 0 ? "overestimated" : "underestimated"
    } the real value by ${Math.abs(
      diff.toFixed(2)
    )}%. In reality, about ${real_perc}% of the population(14M) in the US are currently incarcerated.(The actual number is shown as a red dot)</li>
</ul>`
  );

  d3.selectAll(".row")
    .selectAll(".circle")
    .attr("fill", (d, i) => getColor(d, i));

  function getColor(d, i) {
    if (d == vis.actual_value) {
      return "red";
    } else if (d <= vis.selectedRange) {
      return "blue";
    } else {
      return "white";
    }
  }
  vis.circles.on("mouseover", null);
  vis.circles.on("click", null);
};
