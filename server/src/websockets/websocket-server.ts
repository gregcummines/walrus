import {singleton} from "tsyringe";
import * as WebSocket from 'ws';
import { SensorMessage } from './sensor-message';
import { readAllF, ValueWithID } from "ds18b20-raspi-typescript";
import { IncomingMessage } from "node:http";
import * as nodecron from 'node-cron';
import { createConnection } from "node:net";

interface CustomSocket extends WebSocket {
    isAlive: boolean
}

@singleton()
export class WebSocketServer {
  constructor() {
      this.startMonitoringTemperatures();
  }

  private wss: WebSocket.Server;
  private tempSensors: ValueWithID[] = [];

  setWss(wss: WebSocket.Server) {
    const self = this;
    console.log("Setting up websocket server...");
    this.wss = wss;

    wss.on('connection', function (ws: WebSocket, req: IncomingMessage) {
        console.log(`Client connect via websocket: ${req.url}`);
        ws.send(self.getSensorStatuses());
        const id = setInterval(function () {
          ws.send(self.getSensorStatuses(), function () {
            //
            // Ignore errors.
            //
          });
        }, 5000);
        
        ws.on('close', function () {
          console.log('stopping client interval');
          clearInterval(id);
        });
      });
  }

  getWss(): WebSocket.Server {
      return this.wss;
  }

  getSensorStatuses(): string {
    let sensorMessages: SensorMessage[] = []; 
    this.tempSensors.forEach( (sensor) => {
        sensorMessages.push(new SensorMessage(sensor.id, "temp", `${sensor.t.toString()}F`, new Date()));
    });
    return JSON.stringify(sensorMessages);
  }

  startMonitoringTemperatures() {
    const cron = nodecron.schedule('*/2 * * * * *', () => {
        const tempSensors = readAllF(1, (err: string, results: ValueWithID[]) => {
            if (err) {
                console.warn(err);
            } else {
                results.forEach( (sensor) => {
                    const storedSensor = this.tempSensors.find(element => element.id === sensor.id);
                    if (storedSensor) {
                        storedSensor.t = sensor.t;
                    } else {
                        this.tempSensors.push(sensor);
                    }
                });
            }
        });
    }); 
    cron.start();
  }
}