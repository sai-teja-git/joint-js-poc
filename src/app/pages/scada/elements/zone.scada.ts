import { dia, util } from '@joint/plus';
import { scadaConst } from "../scada.const";

export class Zone extends dia.Element {
    override defaults() {
        return {
            ...super.defaults,
            type: "Zone",
            size: {
                width: 120,
                height: 40
            },
            attrs: {
                body: {
                    fill: "#ffffff",
                    stroke: "#cad8e3",
                    strokeWidth: 1,
                    d: "M 0 calc(0.5*h) calc(0.5*h) 0 H calc(w) V calc(h) H calc(0.5*h) Z"
                },
                label: {
                    fontSize: 14,
                    fontFamily: "sans-serif",
                    fontWeight: "bold",
                    fill: scadaConst.LIQUID_COLOR,
                    textVerticalAnchor: "middle",
                    textAnchor: "middle",
                    x: "calc(w / 2 + 10)",
                    y: "calc(h / 2)"
                }
            }
        };
    }

    override preinitialize() {
        this.markup = util.svg/* xml */ `
            <path @selector="body"/>
            <text @selector="label"/>
        `;
    }
}