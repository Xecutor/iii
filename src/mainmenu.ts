import { Button } from './button';
import { FwdAndBackAnimation } from './animation';
import { tileSize, TileManager } from './tilemanager';
import { uiManager } from './uimanager';
import { UIContainer } from './uicontainer';
import * as gr from './graphics';
import { Pos, randomFromArray } from './utils';
import { CharSelector } from './selectchar';
import { showMessageBox } from './msgbox';

const versionInfo = 'v0.02';
const author = 'Made by Konstantin Stupnik aka Xecutor for 7DRL 2019 ';


let logo: Array<string> = [
    'br lr lr bl    br lr lr bl    br lr lr bl ',
    'tr bl br tl    tr bl br tl    tr bl br tl ',
    '   tb tb          tb tb          tb tb    ',
    '   tb tb          tb tb          tb tb    ',
    'br tl tr bl    br tl tr bl    br tl tr bl ',
    'tr lr lr tl    tr lr lr tl    tr lr lr tl '
]

export class MainMenu extends UIContainer {
    ani: FwdAndBackAnimation = null;
    frame: number;
    constructor() {
        super();
        const menuWidth = 256;
        const menuHeight = 64
        let opts = {minWidth:menuWidth,  minHeight:menuHeight}
        let b = new Button('Start', () => this.startGame(),opts);
        let pos = this.rect.size.toPos().div(2);
        pos.x -= menuWidth / 2;
        b.rect.pos.assign(pos)
        this.add(b);
        pos.y += menuHeight + 32;
        b = new Button('Quit', () => this.quitGame(), opts);
        b.rect.pos.assign(pos)
        this.add(b);
    }
    startGame() {
        this.close();
        uiManager.add(new CharSelector());
    }
    quitGame() {
        let txt = ['Rly?', 'Srsly?', 'Sure?', 'Oh my...', 'Oh no...', 'Nope', 'Rethink please!', 'Ah...', 'Uhh...', 'LALALA, not hearing you!', 
                   'Anything, but that!', 'Gosh...', 'To quit or not to quit, that is the question.', 'One cannot simply quit playing a roguelike game!']
        showMessageBox(randomFromArray(txt))
    }
    draw() {
        super.draw();
        const colors = ['cyan', 'yellow', 'magenta']
        for (let i = 0; i < logo.length; ++i) {
            let l = logo[i]
            let y = tileSize * i
            let pos = new Pos((this.rect.size.width - 14 * tileSize) / 2, y)
            for (let idx = 0; idx < l.length; idx += 3, pos.x += tileSize) {
                let code = l.substr(idx, 3);
                while (code.length && code.charAt(code.length - 1) == ' ') {
                    code = code.substr(0, code.length - 1);
                }
                if (code.length == 0) {
                    continue;
                }
                TileManager.instance.drawTileTinted(pos, 'wall-' + code, colors[(3 * idx / l.length) | 0], this.frame, true)
            }
        }
        gr.setFontSize(16);
        let vsz = gr.getTextSize(versionInfo);
        let y = this.rect.size.height - vsz.height;
        gr.textout(0, y, 'lightgrey', author);
        gr.textout(this.rect.size.width - vsz.width, y, 'lightgrey', versionInfo);
        if (Math.random() < 1 / (25 * 5) && !this.ani) {
            this.ani = new FwdAndBackAnimation((frame) => this.onFrame(frame), 4, 0);
            uiManager.addAnimation(this.ani)
        }
    }
    onFrame(frame: number) {
        this.frame = frame;
        if (!this.frame) {
            this.ani = null;
        }
        return frame != 0;
    }
}

