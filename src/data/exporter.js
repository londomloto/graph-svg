
(function(){
    
    var XMLDOC = '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd" [<!ENTITY nbsp "&#160;">]>';
    
    var Exporter = Graph.data.Exporter = function(vector, options){
        
        this.options = _.extend({}, Exporter.defaults, options || {});
        this.element = vector.node();
        
        var width, height, scale;
        
        if (vector.isPaper()) {
            width  = vector.elem.width();
            height = vector.elem.height();
            scale  = vector.layout().scale();
        } else {
            var bounds = vector.bbox().toJson();
            
            width  = bounds.width;
            height = bounds.height;
            scale  = vector.globalMatrix().scale();
        }
        
        _.assign(this.options, {
            width: width,
            height: height,
            scaleX: scale.x,
            scaleY: scale.y
        });
    };
    
    Exporter.defaults = {
        width: 0,
        height: 0,
        
        scaleX: 1,
        scaleY: 1
    };

    Exporter.prototype.exportDataURI = function() {
        
    };
    
    Exporter.prototype.exportSVG = function() {
        
    };

    Exporter.prototype.exportJPEG = function(filename, compression) {
        var options = _.extend({}, this.options);
        
        options.encoder = 'image/jpeg';
        options.compression = compression || 0.8;
        
        filename = _.defaultTo(filename, 'download.jpg');
        
        exportImage(this.element, options, function(result){
            if (result) {
                document(filename, result);
            }
        });
    };

    Exporter.prototype.exportPNG = function(filename, compression) {
        var options = _.extend({}, this.options);
        
        filename = _.defaultTo(filename, 'download.png');
        
        options.encoder = 'image/png';
        options.compression = compression || 0.8;
        
        exportImage(this.element, options, function(result){
            if (result) {
                download(filename, result);
            }
        });
    };

    Exporter.prototype.exportBlob = function(callback) {
        var options = _.extend({}, this.options);
        
        options.encoder = 'image/jpeg';
        options.compression = 1;
        options.background = '#ffffff';

        exportImage(this.element, options, function(result){
            if (result) {
                var blob = createBlob(result);
                callback && callback(blob);
            } else {
                callback && callback(false);
            }
        });
    };

    ///////// HELPERS /////////
    
    function repair(data) {
        var encoded = encodeURIComponent(data);
        
        encoded = encoded.replace(/%([0-9A-F]{2})/g, function(match, p1) {
            var c = String.fromCharCode('0x'+p1);
            return c === '%' ? '%25' : c;
        });
        
        return decodeURIComponent(encoded);
    }
    
    function download(name, uri) {
        if (navigator.msSaveOrOpenBlob) {
            var blob = createBlob(uri);
            navigator.msSaveOrOpenBlob(blob, name);
            blob = null;
        } else {
            var link = Graph.dom('<a/>');
            
            if ('download' in link) {
                link.download = name;
                link.href = uri;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                window.open(uri, '_download', 'menubar=no,toolbar=no,status=no');
            }
            
            link = null;
        }
    }
    
    function createBlob(uri) {
        var byteString = window.atob(uri.split(',')[1]),
            mimeString = uri.split(',')[0].split(':')[1].split(';')[0],
            buffer = new ArrayBuffer(byteString.length),
            intArray = new Uint8Array(buffer);
        
        for (var i = 0, ii = byteString.length; i < ii; i++) {
            intArray[i] = byteString.charCodeAt(i);
        }
        
        return new Blob([buffer], {type: mimeString});
    }
    
    function exportImage(element, options, callback) {
        var data = createDataURI(element, options),
            image = new Image();
        
        image.onload = function() {
            var canvas, context, result;
            
            canvas = document.createElement('canvas');
            canvas.width  = image.width;
            canvas.height = image.height;
            
            context = canvas.getContext('2d');

            if (options.background) {
                context.fillStyle = options.background;
                context.fillRect(0, 0, canvas.width, canvas.height);
            }

            context.drawImage(image, 0, 0);
            
            try {
                result = canvas.toDataURL(options.encoder, options.compression);
            } catch(e) {
                result = false;
            }
            
            canvas = context = null;
            callback(result);
        };
        
        image.onerror = function() {
            callback(false);
        };
        
        image.src = data; // DOMURL.createObjectURL(blob);
    }
    
    function createDataURI(element, options) {
        var holder = Graph.dom('<div/>'),
            cloned = element.cloneNode(true);
        
        var css, sty, svg, xml, uri;
            
        if (cloned.tagName == 'svg') {
            cloned.setAttribute('width',  options.width);
            cloned.setAttribute('height', options.height);
        } else {
            svg = Graph.dom('<svg/>');
            
            svg.setAttribute('xmlns', Graph.config.xmlns.svg);
            svg.setAttribute('xmlns:xlink', Graph.config.xmlns.xlink);
            svg.setAttribute('version', Graph.config.svg.version);
            svg.setAttribute('width',  options.width);
            svg.setAttribute('height', options.height);
            
            svg.appendChild(cloned);
            cloned = svg;
        }
        
        holder.appendChild(cloned);
        
        css = getElementStyles(element);
        sty = Graph.dom('<style/>');
        sty.setAttribute('type', 'text/css');
        sty.innerHTML = "<![CDATA[\n" + css + "\n]]>";
        
        var first = cloned.childNodes[0];
        
        if (first) {
            cloned.insertBefore(sty, first);
        } else {
            cloned.appendChild(sty);
        }
        
        xml = XMLDOC + holder.innerHTML;
        uri = 'data:image/svg+xml;base64,' + window.btoa(repair(xml));
        
        cloned = holder = null;
        return uri;
    }
    
    function getElementStyles(element) {
        var styles = document.styleSheets,
            result = '';
            
        var rules, rule, found;
        
        for (var i = 0, ii = styles.length; i < ii; i++) {
            
            rules = styles[i].cssRules;
            
            if (rules != null) {
                
                for (var j = 0, jj = rules.length; j < jj; j++, found = null) {
                    
                    rule = rules[j];
                    
                    if (rule.style !== undefined) {
                        if (rule.selectorText) {
                            
                            found = element.querySelector(rule.selectorText);
                            
                            if (found) {
                                result += rule.selectorText + " { " + rule.style.cssText + " }\n";
                            } else if(rule.cssText.match(/^@font-face/)) {
                                result += rule.cssText + '\n';
                            }
                        }
                    }
                }
            }
        }
        
        return result;
    }

}());