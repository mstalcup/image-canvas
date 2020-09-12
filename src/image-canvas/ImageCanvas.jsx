import React from 'react';
import './image-canvas.css';
import {loadImageIntoCanvas} from '../image-canvas/image-canvas.js';

export class ImageCanvas extends React.Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() {

    }

    loadImage() {
        loadImageIntoCanvas();
    }

    render() {
        return (
            <div className="container">
                <button onClick={() => this.loadImage()}>
                    Image stuff
                </button>
                <div>
		            <canvas id="img-canvas"></canvas>
                </div>
                <div className="colors-container"></div>
            </div>
        );
    }
}

export default ImageCanvas;