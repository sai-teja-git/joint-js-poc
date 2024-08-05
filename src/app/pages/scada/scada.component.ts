import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { dia, ui, shapes, util } from '@joint/plus';
import { Zone } from './elements/zone.scada';
import { Pipe } from './elements/pipe.scada';
import { scadaConst } from './scada.const';
import { LiquidTank } from './elements/liquid-tank.scada';
import { ConicTank } from './elements/conic-tank.scada';
import { Panel } from './elements/panel.scada';
import { Pump } from './elements/pump.scada';
import { ControlValve } from './elements/control-valve.scada';
import { HandValve } from './elements/hand-valve.scada';
import { Join } from './elements/join.scada';

@Component({
  selector: 'app-scada',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './scada.component.html',
  styleUrl: './scada.component.scss'
})
export class ScadaComponent {

  @ViewChild('canvas') canvas: ElementRef;

  private graph: dia.Graph
  private paper: dia.Paper;
  private scroller: ui.PaperScroller;

  ngOnInit() {
  }

  public ngAfterViewInit(): void {
    const { scroller, paper, canvas } = this;
    canvas.nativeElement.appendChild(this.scroller.el);
    scroller.center();
    paper.unfreeze();
  }

  setGraph() {

    const PipeView = dia.LinkView.extend({
      presentationAttributes: dia.LinkView.addPresentationAttributes({
        flow: [scadaConst.FLOW_FLAG]
      }),

      initFlag: [...dia.LinkView.prototype.initFlag(), scadaConst.FLOW_FLAG],

      flowAnimation: null,

      confirmUpdate(args: [any, any]) {
        let flags = dia.LinkView.prototype.confirmUpdate.call(this, ...args);
        if (this.hasFlag(flags, scadaConst.FLOW_FLAG)) {
          this.updateFlow();
          flags = this.removeFlag(flags, scadaConst.FLOW_FLAG);
        }
        return flags;
      },

      getFlowAnimation() {
        let { flowAnimation } = this;
        if (flowAnimation) return flowAnimation;
        const [liquidEl] = this.findBySelector("liquid");
        // stroke-dashoffset = sum(stroke-dasharray) * n;
        // 90 = 10 + 20 + 10 + 20 + 10 + 20
        const keyframes = { strokeDashoffset: [90, 0] };
        flowAnimation = liquidEl.animate(keyframes, {
          fill: "forwards",
          duration: 1000,
          iterations: Infinity
        });
        this.flowAnimation = flowAnimation;
        return flowAnimation;
      },

      updateFlow() {
        const { model } = this;
        const flowRate = model.get("flow") || 0;
        this.getFlowAnimation().playbackRate = flowRate;
        const [liquidEl] = this.findBySelector("liquid");
        liquidEl.style.stroke = flowRate === 0 ? "#ccc" : "";
      }
    });

    const PanelView = dia.ElementView.extend({
      presentationAttributes: dia.ElementView.addPresentationAttributes({
        level: [scadaConst.LEVEL_FLAG],
        color: [scadaConst.LEVEL_FLAG]
      }),

      initFlag: [dia.ElementView.Flags.RENDER, scadaConst.LEVEL_FLAG],

      confirmUpdate(args: [any, any]) {
        let flags = dia.ElementView.prototype.confirmUpdate.call(this, ...args);
        if (this.hasFlag(flags, scadaConst.LEVEL_FLAG)) {
          this.updateLevel();
          flags = this.removeFlag(flags, scadaConst.LEVEL_FLAG);
        }
        return flags;
      },

      updateLevel() {
        const { model } = this;
        const level = Math.max(0, Math.min(100, model.get("level") || 0));
        const color = model.get("color") || "red";
        const [liquidEl] = this.findBySelector("liquid");
        const [windowEl] = this.findBySelector("frame");
        const windowHeight = Number(windowEl.getAttribute("height"));
        const height = Math.round((windowHeight * level) / 100);
        liquidEl.animate(
          {
            height: [`${height}px`],
            fill: [color]
          },
          {
            fill: "forwards",
            duration: 1000
          }
        );
      }
    });

    const PumpView = dia.ElementView.extend({
      presentationAttributes: dia.ElementView.addPresentationAttributes({
        power: [scadaConst.POWER_FLAG]
      }),

      initFlag: [dia.ElementView.Flags.RENDER, scadaConst.POWER_FLAG],

      powerAnimation: null,

      confirmUpdate(args: [any, any]) {
        let flags = dia.ElementView.prototype.confirmUpdate.call(this, ...args);
        if (this.hasFlag(flags, scadaConst.POWER_FLAG)) {
          this.togglePower();
          flags = this.removeFlag(flags, scadaConst.POWER_FLAG);
        }
        return flags;
      },

      getSpinAnimation() {
        let { spinAnimation } = this;
        if (spinAnimation) return spinAnimation;
        const [rotorEl] = this.findBySelector("rotor");
        // It's important to use start and end frames to make it work in Safari.
        const keyframes = { transform: ["rotate(0deg)", "rotate(360deg)"] };
        spinAnimation = rotorEl.animate(keyframes, {
          fill: "forwards",
          duration: 1000,
          iterations: Infinity
        });
        this.spinAnimation = spinAnimation;
        return spinAnimation;
      },

      togglePower() {
        const { model } = this;
        this.getSpinAnimation().playbackRate = model.power;
      }
    });

    const ControlValveView = dia.ElementView.extend({
      presentationAttributes: dia.ElementView.addPresentationAttributes({
        open: [scadaConst.OPEN_FLAG]
      }),

      initFlag: [dia.ElementView.Flags.RENDER, scadaConst.OPEN_FLAG],

      framePadding: 6,

      liquidAnimation: null,

      confirmUpdate(args: [any, any]) {
        let flags = dia.ElementView.prototype.confirmUpdate.call(this, ...args);
        this.animateLiquid();
        if (this.hasFlag(flags, scadaConst.OPEN_FLAG)) {
          this.updateCover();
          flags = this.removeFlag(flags, scadaConst.OPEN_FLAG);
        }
        return flags;
      },

      updateCover() {
        const { model } = this;
        const opening = Math.max(0, Math.min(1, model.get("open") || 0));
        const [coverEl] = this.findBySelector("cover");
        const [coverFrameEl] = this.findBySelector("coverFrame");
        const frameWidth =
          Number(coverFrameEl.getAttribute("width")) - this.framePadding;
        const width = Math.round(frameWidth * (1 - opening));
        coverEl.animate(
          {
            width: [`${width}px`]
          },
          {
            fill: "forwards",
            duration: 200
          }
        );
      },

      animateLiquid() {
        if (this.liquidAnimation) return;
        const [liquidEl] = this.findBySelector("liquid");
        this.liquidAnimation = liquidEl.animate(
          {
            // 24 matches the length of the liquid path
            strokeDashoffset: [0, 24]
          },
          {
            fill: "forwards",
            iterations: Infinity,
            duration: 3000
          }
        );
      }
    });

    const namespace = {
      ...shapes,
      Zone,
      Pipe,
      PipeView,
      LiquidTank,
      ConicTank,
      Panel,
      PanelView,
      Pump,
      PumpView,
      ControlValve,
      ControlValveView,
      HandValve,
      Join
    };

    const graph = this.graph = new dia.Graph({}, { cellNamespace: namespace });

    const paper = this.paper = new dia.Paper({
      model: graph,
      width: "100%",
      height: "100%",
      async: true,
      frozen: true,
      sorting: dia.Paper.sorting.APPROX,
      background: { color: "#F3F7F6" },
      interactive: {
        linkMove: false,
        stopDelegation: false
      },
      cellViewNamespace: namespace,
      defaultAnchor: {
        name: "perpendicular"
      }
    });

    const tank1 = new LiquidTank({
      position: { x: 50, y: 250 }
    });
    const panel1 = new Panel({
      position: { x: 70, y: 300 }
    });

    panel1.listenTo(tank1, "change:level", (_, level) => {
      const color =
        level > 80
          ? scadaConst.MAX_LIQUID_COLOR
          : level < 20
            ? scadaConst.MIN_LIQUID_COLOR
            : scadaConst.LIQUID_COLOR;
      panel1.set({ level, color });
    });

    tank1.addTo(graph);
    panel1.addTo(graph);
    tank1.embed(panel1);


    const scroller = this.scroller = new ui.PaperScroller({
      paper,
      autoResizePaper: true,
      cursor: 'grab'
    });

    scroller.render();


    const rect = new shapes.standard.Rectangle({});

    this.graph.addCell(rect);
  }

  createFlow() {

    // Tanks

    const tank1 = new LiquidTank({
      position: { x: 50, y: 250 }
    });
    const panel1 = new Panel({
      position: { x: 70, y: 300 }
    });

    // When the tank level changes, update the panel level and color.
    panel1.listenTo(tank1, "change:level", (_, level) => {
      const color =
        level > 80
          ? scadaConst.MAX_LIQUID_COLOR
          : level < 20
            ? scadaConst.MIN_LIQUID_COLOR
            : scadaConst.LIQUID_COLOR;
      panel1.set({ level, color });
    });

    tank1.addTo(this.graph);
    panel1.addTo(this.graph);
    tank1.embed(panel1);

    // Tank 2

    const tank2 = new ConicTank({
      position: { x: 820, y: 200 }
    });

    tank2.addTo(this.graph);

    // Pumps

    const pump1 = new Pump({
      position: { x: 460, y: 250 },
      attrs: {
        label: {
          text: "Pump 1"
        }
      }
    });

    pump1.addTo(this.graph);
    pump1.power = 1;

    const pump2 = new Pump({
      position: { x: 460, y: 450 },
      attrs: {
        label: {
          text: "Pump 2"
        }
      }
    });

    pump2.addTo(this.graph);
    pump2.power = 0;

    // CTRL Valves

    const controlValve1 = new ControlValve({
      position: { x: 300, y: 295 },
      open: 1,
      attrs: {
        label: {
          text: "CTRL Valve 1"
        }
      }
    });

    controlValve1.addTo(this.graph);

    const controlValve2 = new ControlValve({
      position: { x: 300, y: 495 },
      open: 0.25,
      attrs: {
        label: {
          text: "CTRL Valve 2"
        }
      }
    });

    controlValve2.addTo(this.graph);

    // Zones

    const zone1 = new Zone({
      position: { x: 50, y: 600 },
      attrs: {
        label: {
          text: "Zone 1"
        }
      }
    });

    const zone2 = new Zone({
      position: { x: 865, y: 600 },
      attrs: {
        label: {
          text: "Zone 2"
        }
      }
    });

    this.graph.addCells([zone1, zone2]);

    // Hand Valves

    const handValve1 = new HandValve({
      position: { x: 875, y: 450 },
      open: 1,
      angle: 270,
      attrs: {
        label: {
          text: "Valve 1"
        }
      }
    });

    handValve1.addTo(this.graph);

    const handValve2 = new HandValve({
      position: { x: 650, y: 250 },
      open: 1,
      angle: 0,
      attrs: {
        label: {
          text: "Valve 2"
        }
      }
    });

    handValve2.addTo(this.graph);

    const handValve3 = new HandValve({
      position: { x: 650, y: 450 },
      open: 1,
      angle: 0,
      attrs: {
        label: {
          text: "Valve 3"
        }
      }
    });

    handValve3.addTo(this.graph);

    // Joins

    const join1 = new Join({
      position: { x: 772, y: 460 }
    });

    join1.addTo(this.graph);

    const join2 = new Join({
      position: { x: 810, y: 605 }
    });

    join2.addTo(this.graph);

    // Pipes

    const tank1Pipe1 = new Pipe({
      source: {
        id: tank1.id,
        anchor: { name: "right", args: { dy: -25 } },
        connectionPoint: { name: "anchor" }
      },
      target: {
        id: controlValve1.id,
        port: "left",
        anchor: { name: "left" }
      }
    });

    tank1Pipe1.addTo(this.graph);

    const tank1Pipe2 = new Pipe({
      source: {
        id: tank1.id,
        anchor: { name: "bottomRight", args: { dy: -40 } },
        connectionPoint: { name: "anchor" }
      },
      target: {
        id: controlValve2.id,
        port: "left",
        anchor: { name: "left" },
        connectionPoint: { name: "anchor" }
      }
    });

    tank1Pipe2.addTo(this.graph);

    const tank2Pipe1 = new Pipe({
      source: {
        id: tank2.id,
        selector: "bottom",
        anchor: { name: "bottom" },
        connectionPoint: { name: "anchor" }
      },
      target: {
        id: handValve1.id,
        port: "right",
        anchor: { name: "right", args: { rotate: true } },
        connectionPoint: { name: "anchor" }
      }
    });

    tank2Pipe1.addTo(this.graph);

    const ctrlValve1Pipe1 = new Pipe({
      source: { id: controlValve1.id, port: "right", anchor: { name: "right" } },
      target: { id: pump1.id, port: "left", anchor: { name: "left" } }
    });

    ctrlValve1Pipe1.addTo(this.graph);

    const valve2Pipe1 = new Pipe({
      source: {
        id: handValve2.id,
        port: "right",
        anchor: { name: "right", args: { rotate: true } },
        connectionPoint: { name: "anchor" }
      },
      target: {
        id: join1.id,
        anchor: { name: "top" },
        connectionPoint: { name: "anchor" }
      }
    });

    valve2Pipe1.addTo(this.graph);

    const valve1Pipe1 = new Pipe({
      source: {
        id: handValve1.id,
        port: "left",
        anchor: { name: "left", args: { rotate: true } },
        connectionPoint: { name: "anchor" }
      },
      target: {
        id: join2.id,
        anchor: { name: "top" },
        connectionPoint: { name: "anchor" }
      }
    });

    valve1Pipe1.addTo(this.graph);

    const pump1Pipe1 = new Pipe({
      source: {
        id: pump1.id,
        port: "right",
        anchor: { name: "right", args: { rotate: true } },
        connectionPoint: { name: "anchor" }
      },
      target: {
        id: handValve2.id,
        port: "left",
        anchor: { name: "left", args: { rotate: true } },
        connectionPoint: { name: "anchor" }
      }
    });

    pump1Pipe1.addTo(this.graph);

    const valve3Pipe1 = new Pipe({
      source: {
        id: handValve3.id,
        port: "right",
        anchor: { name: "right", args: { rotate: true } },
        connectionPoint: { name: "anchor" }
      },
      target: {
        id: join1.id,
        anchor: { name: "left" },
        connectionPoint: { name: "anchor" }
      }
    });

    valve3Pipe1.addTo(this.graph);

    const pump2Pipe1 = new Pipe({
      source: {
        id: pump2.id,
        port: "right",
        anchor: { name: "right", args: { rotate: true } },
        connectionPoint: { name: "anchor" }
      },
      target: {
        id: handValve3.id,
        port: "left",
        anchor: { name: "left", args: { rotate: true } },
        connectionPoint: { name: "anchor" }
      }
    });

    pump2Pipe1.addTo(this.graph);

    const ctrlValve2Pipe1 = new Pipe({
      source: { id: controlValve2.id, port: "right", anchor: { name: "right" } },
      target: {
        id: pump2.id,
        port: "left",
        anchor: { name: "left", args: { rotate: true } },
        connectionPoint: { name: "anchor" }
      }
    });

    ctrlValve2Pipe1.addTo(this.graph);

    const zone1Pipe1 = new Pipe({
      source: {
        id: zone1.id,
        port: "left",
        anchor: { name: "left", args: { rotate: true, dx: 10 } },
        connectionPoint: { name: "anchor" }
      },
      target: {
        id: tank1.id,
        anchor: { name: "bottomLeft", args: { dy: -30 } },
        connectionPoint: { name: "anchor" }
      }
    });

    zone1Pipe1.addTo(this.graph);

    const join1Pipe1 = new Pipe({
      source: {
        id: join1.id,
        anchor: { name: "bottom" },
        connectionPoint: { name: "anchor" }
      },
      target: {
        id: join2.id,
        anchor: { name: "left" },
        connectionPoint: { name: "anchor" }
      }
    });

    join1Pipe1.addTo(this.graph);

    const join2Pipe1 = new Pipe({
      source: {
        id: join2.id,
        anchor: { name: "right" },
        connectionPoint: { name: "anchor" }
      },
      target: {
        id: zone2.id,
        anchor: { name: "left", args: { dx: 10 } },
        connectionPoint: { name: "anchor" }
      }
    });

    join2Pipe1.addTo(this.graph);


  }

}
