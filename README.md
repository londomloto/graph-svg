# Graph SVG Library

A SVG library used by easyflow

## Engine API

#### Graph(ready)

Dom ready wrapper.

```javascript
Graph(function(){
	// create paper
    var paper = Graph.paper().render('#div');
    
    // draw some vector
    var path = paper.path('M 0 0 L 100 100 L 100 200 L 0 200 Z');
    var rect = paper.rect(0, 0, 100, 100);
    var circle = paper.circle(30, 30, 30);
    var ellipse = paper.ellipse(30, 30, 30, 30);
    var polygon = paper.polygon('0,0 100,100 100,200 0,200');
    
    // manipulate
    rect.rotate(45).scale(1.2).commit();
    polygon.transform('translate(100,100) scale(1.2) rotate(45)');
    
    // animate
    circle.animable().animate({cx: 200, cy: 200}, 1000, 'bounce');
    
    // etc...
});
```

#### Graph.paper([width = 800 [, height = 600]])

Create new paper.

```javascript
var paper = Graph.paper(800, 600).render('#div');
// or
var paper = (new Graph.svg.Paper(800, 600)).render('#div');
```

#### Paper.rect([x = 0 [, y = 0 [, width = 0 [, height = 0]]]])

Create and render rectangle into paper

```javascript
var r = paper.rect(20, 20, 100, 100);
// or
var r = (new Graph.svg.Rect(20, 20, 100, 100)).render(paper);
```

#### Paper.circle([cx = 0 [, cy = 0 [, r = 0]]])

Create and render circle into paper

```javascript
var c = paper.circle(20, 20, 30);
// or
var r = (new Graph.svg.Circle(20, 20, 30)).render(paper);
```
## Core Plugins

#### draggable([options])
Get or set drag plugin
```javascript
var r = paper.rect();

r.draggable({
	ghost: true,
    hint: true,
    axis: 'x',
    grid: [10, 10]
});

// get plugin, then set snapping
r.draggable().snap([{x: 100}])

```
#### resizable([options])
Get or set resize plugin
```javascript
var r = paper.rect();
r.resizable();
```

#### editable([options])
Get or set label editor plugin
```javascript
var r = paper.rect();
r.editable();
```
#### connectable([options])
Get or set link provider plugin
```javascript
var r = paper.rect();
r.connectable({
	wiring: 'h:h'
});
```
#### zoomable([options])
Get or set panzoom plugin
```javascript
var p = Graph.paper();
p.zoomable();
```

#### animable([options])
Get or set animator plugin
```javascript
var r = paper.rect();
r.animable().animate({x: 100}, 1000, 'bounce');
```

## Layout

#### default
```javascript
// create paper
var p = Graph.paper().render('#div');

// setup layout
p.layout('default', {
	router: {
    	type: 'orthogonal'
    },
    link: {
    	type: 'rounded'
    }
});

// add new rectangle
p.rect();

// refresh
p.layout().refresh();
```

## Link (Connector)
By default, link type defined in layout
```javascript
var p = Graph.paper().render('#div');
var a = p.rect();
var b = p.circle();

// connect two vector
p.connect(a, b);

```

## Directed Link
```javascript

var rect1 = paper.rect();
var rect2 = paper.rect();

var router = new Graph.router.Directed(rect1, rect2);
var link = new Graph.link.Directed(router);
link.connect();
link.render(paper);

```
## Orthogonal Link

```javascript

var rect1 = paper.rect();
var rect2 = paper.rect();

var router = new Graph.router.Orthogonal(rect1, rect2);
var link = new Graph.link.Orthogonal(router);
link.connect();
link.render(paper);