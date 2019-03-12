import { Label } from './label';
import { TileManager, tileFullSize } from './tilemanager';
import { isNextToExplored } from './generators';
import { MapAccessor } from "./mapaccessor";
import { Player } from './player';
import { UIContainer } from './uicontainer';
import * as gr from './graphics';
import { Rect, Pos, Size, DIR } from "./utils";
import { RES } from "./resources";

export const hudWIdth = 320;

export class Hud extends UIContainer {
    player: Player;
    map: MapAccessor;

    resLabels: Array<Label> = [];

    dynStart: Pos;

    constructor(player: Player) {
        super();
        this.player = player;
        let sz = gr.getAppSize();
        this.rect = new Rect(sz.width - hudWIdth, 0, hudWIdth, sz.height);
        let pos = this.rect.pos.clone().add(10, 10);
        for (let i = 0; i < RES.count; ++i) {
            let r = player.getResource(i);
            let l = new Label(pos, '', r.color, 16);
            this.add(l);
            pos.y += gr.getTextHeight() + 2;
            this.resLabels[i] = l;
        }
        pos.y += 4;
        /*        let b=new Button('Prog', ()=>actions.openPrograms(), 16);
                b.rect.pos.assign(pos);
                this.add(b);
                let bpos=pos.clone();
                bpos.x+=b.rect.size.width+4;
                b=new Button('Conn',()=>actions.toggleConnMode(), 16);
                this.add(b);
                b.rect.pos.assign(bpos)
                bpos.x+=b.rect.size.width+4;
                b=new Button('Branch', ()=>actions.addBranch(), 16);
                b.rect.pos.assign(bpos);
                this.add(b);
                bpos.x+=b.rect.size.width+4;
                b=new Button('Next', ()=>actions.nextConnect(), 16);
                b.rect.pos.assign(bpos);
                this.add(b);
                pos.y+=20;*/
        this.dynStart = pos;
    }

    assignMap(map:MapAccessor) {
        this.map = map
    }

    private divLine(pos: Pos) {
        pos.y += 4;
        gr.line(pos.clone().sub(10, 0), pos.clone().add(this.rect.size.width, 0), 'cyan', 0.5);
        pos.y += 4;
    }

    drawMiniMap(pos: Pos) {
        let rooms = this.map.getRoomsInfo()
        let minx, maxx, miny, maxy : number;
        for(let r of rooms) {
            if(r.explored) {
                if(minx===undefined || r.pos.x < minx) {
                    minx = r.pos.x
                }
                if(miny===undefined || r.pos.y < miny) {
                    miny = r.pos.y
                }
                if(maxx===undefined || r.pos.x > maxx) {
                    maxx = r.pos.x
                }
                if(maxy===undefined || r.pos.y > maxy) [
                    maxy = r.pos.y
                ]
            }
        }
        let roomSize = 30
        let corrSize = 6
        let mxsz = Math.max(maxx-minx+3, maxy-miny+3)
        if( roomSize * mxsz > hudWIdth) {
            roomSize = hudWIdth/mxsz
        }
        let cx = pos.x + hudWIdth / 2 - roomSize / 2;
        let cy = pos.y + hudWIdth / 2 - roomSize / 2;
        for (let pass = 0; pass < 2; ++pass) {
            for (let idx = 0; idx < rooms.length; ++idx) {
                let r = rooms[idx]
                if (r.explored || isNextToExplored(r, rooms)) {
                    let rx = roomSize * (r.pos.x - (maxx + minx) / 2)
                    let ry = roomSize * (r.pos.y - (maxy + miny) / 2)
                    let rect = new Rect(cx + corrSize / 2 + rx, cy + corrSize / 2 + ry, roomSize - corrSize / 2, roomSize - corrSize / 2)
                    if (r.explored) {
                        let playerRoom = this.map.mapPGet(this.player.pos).roomIdx
                        if(pass==1) {
                            gr.fillrect(rect, idx == playerRoom ? '#ffffff' : '#aaaaaa')
                        }
                        else {
                            for (let d of r.doors) {
                                let drect = new Rect(rect.sideMiddle(d.dir), new Size(corrSize, corrSize))
                                switch (d.dir) {
                                    case DIR.t: drect.pos.sub(corrSize / 2, corrSize); break;
                                    case DIR.b: drect.pos.sub(corrSize / 2, 0); break;
                                    case DIR.l: drect.pos.sub(corrSize, corrSize / 2); break;
                                    case DIR.r: drect.pos.sub(0, corrSize / 2); break;
                                }
                                gr.fillrect(drect, playerRoom == d.corrIdx ? '#ffffff' : '#aaaaaa')
                            }
                        }
                    }
                    else {
                        gr.rect(rect, '#999999')
                    }
                }
            }
        }
        pos.y += hudWIdth
    }

    draw() {
        gr.rect(this.rect, 'lightgrey', 1);

        let pos = this.dynStart.clone();

        for (let i = 0; i < RES.count; ++i) {
            let r = this.player.getResource(i);
            let txt = `${r.descr}: ${r.value}/${r.maxValue}`;
            this.resLabels[i].label = txt;
        }

        super.draw();

        this.divLine(pos);

        this.drawMiniMap(pos);

        this.divLine(pos);


        let ti = this.map.mapGet(this.map.mouseMapPos.x, this.map.mouseMapPos.y);
        if (ti && ti.tile && ti.visible) {
            TileManager.instance.drawTile(pos, ti.tileName, ti.tileFrame);
            pos.y += tileFullSize;
            gr.textout(pos.x, pos.y, 'white', ti.tile.getDescription());
            pos.y += gr.getTextHeight();
            this.divLine(pos);
            for (let en of ti.entities) {
                TileManager.instance.drawTile(pos, en.tileName, en.tileFrame);
                pos.y += tileFullSize;
                let txt = en.getDescription()
                if(en.isEnemy) {
                    txt += ` Hp:${en.getHp()}`
                }
                gr.textout(pos.x, pos.y, 'white', txt);
                pos.y += gr.getTextHeight();
                this.divLine(pos);
            }
        }
        gr.textout(this.rect.pos.x, this.rect.pos.y + this.rect.size.height - gr.getTextHeight(), 'white', `${this.map.mouseMapPos.x},${this.map.mouseMapPos.y}(${ti?ti.roomIdx:'??'})`);
    }
}
