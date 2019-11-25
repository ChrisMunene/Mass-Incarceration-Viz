Scatterplot = function (_parentElement, _data) {
    this.parentElement = _parentElement;
    let {us, prisonData} = _data;
    console.log("data");
    console.log(_data);
    this.us = us;
    this.prisonData = prisonData;
    this.initVis();
}

