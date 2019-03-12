import { UIBase, MyMouseEvent } from './uibase';
import * as gr from './graphics';
import { Pos } from './utils';

export interface ButtonOptions {
    fontSize?: number
    minWidth?: number
    minHeight?: number
}

export class Button extends UIBase {
    color: string = 'white';
    label: string;
    labelPos: Pos
    fontSize = 32;
    constructor(label: string, onClick: () => void, options?: ButtonOptions) {
        super();
        this.label = label;
        this.onClick = onClick;
        let minWidth = 0
        let minHeight = 0
        if (options) {
            if (options.fontSize) {
                this.fontSize = options.fontSize;
            }
            if (options.minWidth) {
                minWidth = options.minWidth
            }
            if (options.minHeight) {
                minHeight = options.minHeight
            }
        }
        gr.setFontSize(this.fontSize);
        this.rect.size.assign(gr.getTextSize(label));
        this.rect.size.width += 4;
        this.rect.size.height += 4;
        if (this.rect.size.width < minWidth) {
            this.rect.size.width = minWidth
        }
        if (this.rect.size.height < minHeight) {
            this.rect.size.height = minHeight
        }
        this.labelPos = this.rect.size.toPos().sub(gr.getTextSize(this.label).toPos()).div(2)
    }
    draw() {
        gr.setFontSize(this.fontSize);
        gr.rect(this.rect, 'lightgrey', 2, this.mouseOver ? 10 : 0);
        let pos = this.labelPos.clone().add(this.rect.pos)
        gr.textout(pos.x, pos.y, this.color, this.label);
    }
}

export class CloseButton extends Button {
    color = 'red'
    onClose?: () => void
    constructor() {
        super('X', () => this.doClose());
    }
    doClose() {
        this.parent.close()
        if (this.onClose) {
            this.onClose()
        }
    }
    onAdd() {
        this.rect.pos.assign(this.parent.rect.pos);
        this.rect.pos.x += this.parent.rect.size.width - 32;
        this.rect.size.width = 32;
        this.rect.size.height = 32;
    }
}