import sunflowers from '../sunflowers.jpg';

let canvas;
let ctx;

var pixelColorBuckets = []
var uniquePixelColors = [];
var pixelColorCountMap = [];
var colorIdToPixelsMap = [];

document.addEventListener("DOMContentLoaded", function(){
    canvas = document.getElementById('img-canvas');
    ctx = canvas.getContext('2d');
});

export function loadImageIntoCanvas(){
    let img = loadImage(sunflowers);
    
    img.onload = function() {
        fitCanvasToImage(img);
        populatePixelColorArray();
        sortPixelColorArray();
        createPixelColorUi();
    }
}

function loadImage(imageSource) {
    var img = new Image();
    img.crossOrigin='anonymous';
    img.src=imageSource;
    return img;
}

function fitCanvasToImage(img) {
    ctx.canvas.width = img.width;
    ctx.canvas.height = img.height;
    ctx.drawImage(img,0,0);
}

function populatePixelColorArray() {
    uniquePixelColors = [];
    pixelColorCountMap = [];

    let data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    // enumerate all pixels - each pixel's r,g,b,a data are stored in separate sequential array elements
    for(let i = 0; i < data.length; i += 4) {
        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];
        const alpha = data[i + 3];

        const colorString = "rgba(" + red + "," + green + "," + blue + "," + alpha + ")";
        let pixelColorCount = pixelColorCountMap[colorString];
        
        if(pixelColorCount) {
            pixelColorCountMap[colorString] = pixelColorCount+1;
        }
        else{
            let hue = rgbToHsv(red, green, blue).h;
            pixelColorCountMap[colorString] = 1;
            uniquePixelColors.push({
                "red": red,
                "green": green,
                "blue": blue,
                "alpha": alpha,
                "color": colorString,
                "hue": hue,
                "hex": rgbToHex([red, green, blue])
            });
        }
    }
}

function sortPixelColorArray() {
    uniquePixelColors.sort(function(a, b){
        return (a.red + a.green + a.blue) - (b.red + b.green + b.blue);
    });

    uniquePixelColors.sort(function(a, b){
        return pixelColorCountMap[a.color] - pixelColorCountMap[b.color];
    }).reverse();
}

function createPixelColorUi() {
    let c = 0;
    uniquePixelColors.forEach(function(pixel,index) {
        let hue = Math.floor(pixel.hue/10);
        if(!pixelColorBuckets[hue/10]){
            pixelColorBuckets[hue/10] = [];
        }
        pixelColorBuckets[hue/10].push(pixel.hex);
    });

    let colorContainer = document.createElement("div");
    for(var hue in pixelColorBuckets){
        let pixelsForHue = pixelColorBuckets[hue];

        // pixelsForHue.sort(function(a, b){
        //     return a.hue - b.hue;
        // });

        pixelsForHue.sort();

        //TODO: what is the "react" way to do this?

        let label = document.createElement("label");
        let input = document.createElement("input");
        input.type = "color";
        input.value = pixelsForHue[0];
        input.classList.add("hidden");
        input.onchange = function(){
            let colorToChangeTo = this.value;
            pixelsForHue.forEach(function(pixel){
                modifyPixelRgb(colorToChangeTo, pixel);
            });
            //TODO: modify all pixels in bucket for this hue, use same relative red/blue/green shift
            // modifyPixelRgb(this);
        };

        let colorBlock = document.createElement("div");
        colorBlock.classList.add("color-div");
        console.log("###" + "linear-gradient(to right, " + pixelsForHue[0] + "," + pixelsForHue[pixelsForHue.length-1] + ")");
        colorBlock.style.backgroundImage = "linear-gradient(to right, " + pixelsForHue[0] + "," + pixelsForHue[pixelsForHue.length-1] + ")";
        label.append(colorBlock);
        label.append(input);
        colorContainer.append(label);
        document.querySelector(".colors-container").append(colorContainer);
    }
    
    uniquePixelColors.forEach(function(pixel){
        if(c > 5000){
            return;
        }
        c++;
        let colorContainer = document.createElement("div");
        let colorBlock = document.createElement("div");
        colorBlock.classList.add("color-div");
        colorBlock.style.background = pixel.color;

        let input = document.createElement("input");
        input.type = "color";
        input.value = pixel.hex;
        input.id = pixel.hex;
        input.oninput = function(){
            modifyPixelRgb(this.value, this.id);
        };

        let countSpan = document.createElement("span");
        countSpan.innerText = pixelColorCountMap[pixel.color];

        colorContainer.append(colorBlock);
        colorContainer.append(input);
        colorContainer.append(countSpan);
        document.querySelector(".colors-container").append(colorContainer);
    });
}

function modifyPixelRgb(colorToChangeTo, originalHex) {
    console.log("colorToChangeTo " + JSON.stringify(colorToChangeTo));

    let pixelCoordsArray = getPixelCoordsArrayForColorInput(originalHex);

    ctx.fillStyle = colorToChangeTo;
    for(let i = 0; i < pixelCoordsArray.length; i++){
        let coords = pixelCoordsArray[i];
        ctx.fillRect(coords[0], coords[1], 1, 1);
    }
}

function getPixelCoordsArrayForColorInput(hex) {
    if(!colorIdToPixelsMap[hex]){
        populateColorIdToPixelsMapForColorId(hex);
    }

    return colorIdToPixelsMap[hex];
}

//get array of pixels that are associated with an input
function populateColorIdToPixelsMapForColorId(hex) {
    let targetRgbColor = hexToRgb(hex);
    let pixelCoords = [];
    let data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    // enumerate all pixels
    // each pixel's r,g,b,a datum are stored in separate sequential array elements
    for(let i = 0; i < data.length; i += 4) {
        if(data[i] === targetRgbColor[0]
            && data[i + 1] === targetRgbColor[1]
            && data[i + 2] === targetRgbColor[2]
        ){
            let x = i/4 % ctx.canvas.width;
            let y = i/4 / ctx.canvas.width;
            pixelCoords.push([x,y]);
        }
    }
    colorIdToPixelsMap[hex] = pixelCoords;
}

/**
 * thanks to https://stackoverflow.com/questions/13070054/convert-rgb-strings-to-hex-in-javascript
 */
function rgbToHex(rgb){
    return "#" + ((rgb[0] << 16) | (rgb[1] << 8) | rgb[2]).toString(16);
}

/**
 * thanks to https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
 */
function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ];
}
  
/**
 * thanks to https://stackoverflow.com/questions/8022885/rgb-to-hsv-color-in-javascript
 */
function rgbToHsv(r, g, b) {
    let rabs, gabs, babs, rr, gg, bb, h, s, v, diff, diffc, percentRoundFn;
    rabs = r / 255;
    gabs = g / 255;
    babs = b / 255;
    v = Math.max(rabs, gabs, babs);
    diff = v - Math.min(rabs, gabs, babs);
    diffc = c => (v - c) / 6 / diff + 1 / 2;
    percentRoundFn = num => Math.round(num * 100) / 100;
    if (diff == 0) {
        h = s = 0;
    } else {
        s = diff / v;
        rr = diffc(rabs);
        gg = diffc(gabs);
        bb = diffc(babs);

        if (rabs === v) {
            h = bb - gg;
        } else if (gabs === v) {
            h = (1 / 3) + rr - bb;
        } else if (babs === v) {
            h = (2 / 3) + gg - rr;
        }
        if (h < 0) {
            h += 1;
        }else if (h > 1) {
            h -= 1;
        }
    }
    return {
        h: Math.round(h * 360),
        s: percentRoundFn(s * 100),
        v: percentRoundFn(v * 100)
    };
}