/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import Settings from './settings';
import {
  AppRegistry,
  Dimensions,
  StyleSheet,
  Text,
  View
} from 'react-native';
import Camera from 'react-native-camera';
import fs from 'react-native-fs';

class rnOcrSample extends Component {
    constructor() {
        super();
        this.state = {
            ocrStatus: 'ready',
            ocrText: ''
        };
    }
    render() {
        return (
            <View style={styles.container}>
                <Camera
                    ref={(cam) => { this.camera = cam; }}
                    style={styles.preview}
                    aspect={Camera.constants.Aspect.fill}
                    captureTarget={Camera.constants.CaptureTarget.temp}
                    captureAudio={false}>
                    <Text style={styles.text}>(status: {this.state.ocrStatus}) {this.state.ocrText}</Text>
                    <Text style={styles.capture} onPress={this.takePicture.bind(this)}>[CAPTURE]</Text>
                </Camera>
            </View>
        );
    }

    takePicture() {
        const flatMap = (arr, f) => arr.reduce((a, e) => a.concat(f(e)), []);
        const url = 'https://api.projectoxford.ai/vision/v1.0/ocr?language=en&detectOrientation=true';
        this.camera.capture()
            .then((obj) => {
                this.setState({ ocrStatus: 'uploading' });
                return fs.uploadFiles({
                    toUrl: url, /// FIXME: TYPO
                    files: [{
                        filename: 'photo.png',
                        filepath: obj.path,
                    }],
                    method: 'POST',
                    headers: {
                        'Ocp-Apim-Subscription-Key': Settings.appKey,
                    },
                    progressCallback: ({totalBytesSent, totalBytesExpectedToSend}) => { /// FIXME: typo
                        var percentage = (totalBytesSent * 100 / totalBytesExpectedToSend) >> 0;
                        this.setState({ ocrStatus: `uploading ${percentage}%`});
                    }
                }).then((response) => {
                    return JSON.parse(response.response);
                }).then((json) => {
                    try {
                        const text = flatMap(json.regions, e => flatMap(e.lines, x => x.words.map(q => q.text))).join(" ");
                        this.setState({
                            ocrStatus: 'ready',
                            ocrText: text,
                        });
                        return text;
                    } catch (ex) {
                        return Promise.reject('Parse Error');
                    }
                }).catch(err => {
                    this.setState({ ocrStatus: 'error: ' + err });
                    console.error(err);
                });
            }).catch(err => console.error(err));
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    preview: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
        height: Dimensions.get('window').height,
        width: Dimensions.get('window').width
    },
    capture: {
        flex: 0,
        backgroundColor: '#fff',
        borderRadius: 5,
        color: '#000',
        padding: 10,
        margin: 40
    }
});

AppRegistry.registerComponent('rnOcrSample', () => rnOcrSample);
