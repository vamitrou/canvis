// View base class

function View(id, x, y, width, height) {
	this.id = id;
	this.x = x;
	this.y = y;
	this.z = 0;

	this.rel_x = 0;
	this.rel_y = 0;

	this.width = width;
	this.height = height;

	this.backgroundColor = "#FFFFFF";

	this.context = null;
	this.parent = null;
	this.children = new Array();

	this.clickListener = null;
}

View.prototype.addView = function(view) {
	this.children.push(view); 
	view.setParent(this);
	view.setContext(this.context);

	view.rel_x = this.rel_x + view.x;
	view.rel_y = this.rel_y + view.y;
	
	view.z = this.z + 1;
}

View.prototype.setX = function(x) {
	var dx = x - this.x;
	this.x += dx;
	this.rel_x += dx;
}

View.prototype.setY = function(y) {
	var dy = this.y;
	this.y += dy;
	this.rel_y += dy;
}

View.prototype.click = function() {
	if (this.clickListener != null)
	{
		this.clickListener();
	}
}

View.prototype.setClickListener = function(listener) {
	this.clickListener = listener;
}

View.prototype.setBackgroundColor = function(color) {
	this.backgroundColor = color;
}

View.prototype.setParent = function(view) {
	this.parent = view;
}

View.prototype.setContext = function(context) {
	this.context = context;
}

View.prototype.draw = function() {
	this.context.fillStyle = this.backgroundColor;
	this.context.fillRect(this.rel_x, this.rel_y, this.width, this.height);

	for (var i in this.children) {
		this.children[i].draw();
	}
}


// Image View
function ImageView(id, x, y, width, height, image) {
	View.prototype.constructor.call(this, id, x, y, width, height);
	this.image_url = image;
	this.image_obj = new Image();
	
	this.image_obj.onload = function()
	{
		rootView.draw();
	}
	this.image_obj.src = this.image_url;
}

ImageView.prototype = Object.create(View.prototype);
ImageView.prototype.constructor = ImageView;


ImageView.prototype.draw = function() {
	this.context.drawImage(this.image_obj, this.rel_x, this.rel_y, this.width, this.height);
}


// Text View 
function TextView(id, x, y, text) {
	View.prototype.constructor.call(this, id, x, y, 0, 0);
	this.text = text;

	this.color = "#000000";
	this.style = ""; // bold
	this.font = "Arial";
	this.fontSize = 16;
}

TextView.prototype = Object.create(View.prototype);
TextView.prototype.context = TextView;

TextView.prototype.getWidth = function() {
	var metrics = this.context.measureText(this.text);
	return metrics.width;
}

TextView.prototype.getHeight = function() {
	return this.fontSize * 1.5 / 2;
}

TextView.prototype.setText = function(text) {
	this.text = text;
	invalidate();
}

TextView.prototype.draw = function() {
	this.context.font = this.style + " " + this.fontSize + "px " +  this.font;
	this.context.fillStyle = this.color;
	//this.context.textAlign = 'center';
	this.context.fillText(this.text, this.rel_x, this.rel_y + this.getHeight());

	this.width = this.getWidth();
	this.height = this.getHeight();
}

// Button View
function ButtonView(id, x, y, width, height, title) { 
	View.prototype.constructor.call(this, id, x, y, width, height);

	this.title = title;
	this.borderColor = "#000000";
	this.highlightColor = "#CCCCCC";

	this.textView = new TextView(id + "_text", x, y, title);

	this.highlighted = false;
}

ButtonView.prototype = Object.create(View.prototype);
ButtonView.prototype.context = ButtonView;

ButtonView.prototype.draw = function() {

	if (this.highlighted)
	{
		this.context.fillStyle = this.highlightColor;
		this.context.fillRect(this.rel_x, this.rel_y, this.width, this.height);
	}

	this.context.strokeStyle = this.borderColor;
	this.context.strokeRect(this.rel_x, this.rel_y, this.width, this.height);
	
	this.children = [];
	this.textView.setContext(this.context);

	var text_width = this.textView.getWidth();
	var text_height = this.textView.getHeight();
	
	this.textView.rel_x = (this.width - text_width)/2 + this.rel_x;
	this.textView.rel_y = (this.height - text_height)/2 + this.rel_y;

	this.textView.draw();
}

/////////////////////////////////////////////////////////////////// 	Toolset

// Misc toolset 

var rootView;
var needsRedraw;

function getRootView(canvasID) 
{
	var canvas = document.getElementById(canvasID);
	var ctx = canvas.getContext("2d");

	canvas.addEventListener('click', clickHandler, false);
	canvas.addEventListener('mousedown', mouseDown, false);
	canvas.addEventListener('mouseup', mouseUp, false);
	canvas.addEventListener('mousemove', mouseMove, false);

	rootView = new View("root", 0, 0, canvas.width, canvas.height);
	rootView.setContext(ctx);

	rootView.draw();

	return rootView;
}

function clickHandler(e) 
{
	//console.log('click: ' + e.offsetX + ',' + e.offsetY);
	if (rootView == null)
		return;

	var obj = hitTest(e.offsetX, e.offsetY, rootView);
	//debugger;
	if (obj)
	{
		obj.click();
	}
}

function mouseDown(e)
{
	var obj = hitTest(e.offsetX, e.offsetY, rootView);
	if (obj)
	{
		obj.highlighted = true;
		invalidate();
	}
}

function mouseUp(e)
{
	var obj = hitTest(e.offsetX, e.offsetY, rootView);
	if (obj)
	{
		obj.highlighted = false;
		invalidate();
	}
}

function mouseMove(e)
{
	hitTest(e.offsetX, e.offsetY, rootView);	
	if (needsRedraw)
		invalidate();
}

function hitTest(x, y, view)
{
	if (x >= view.rel_x && x <= view.rel_x + view.width
		&& y >= view.rel_y && y <= view.rel_y + view.height)
	{
		var obj = view;
		for (var i=0; i<view.children.length; i++)
		{
			var clicked = hitTest(x, y, view.children[i]);
			if (clicked) obj = clicked;
		}	
		obj.highlighted = true;
		needsRedraw = true;
		return obj;
	}
	
	if (view.highlighted)
	{
		view.highlighted = false;
		needsRedraw = true;
	}
	return null;
}

function invalidate()
{
	if (rootView != null)
		rootView.draw();

	needsRedraw = false;
}

/*function addRect()
{
	ctx.fillStyle="#FF0000";
	ctx.fillRect(0,0,150,75);
}

function setImage(src, callback)
{
	var imageObj = new Image();
	imageObj.onload = function() 
	{
		callback();
		//ctx.drawImage(imageObj, 0, 0);
	};
	imageObj.src = src;
}*/

