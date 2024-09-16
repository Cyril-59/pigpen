import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren
} from '@angular/core';
import {ActivatedRoute, RouterOutlet} from '@angular/router';
import {FormsModule} from "@angular/forms";
import {JsonPipe, NgClass, NgStyle} from "@angular/common";
import html2canvas from "html2canvas";
import {switchMap, tap} from "rxjs";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, FormsModule, NgClass, JsonPipe, NgStyle],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  lettres = '';
  chiffres = '';
  notShifted = ['S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '_'];
  array: string[] = [];
  doubleArray: string[][] = [];
  positions = new Map<number, string[]>([
    [2, ["2", "11"]],
    [3, ["3", "12", "21", "111"]],
    [4, ["4", "22", "13", "31", "121", "211", "112", "1111"]],
    [5, ["5", "32", "23", "41", "14", "311", "131", "113", "221", "212", "122", "2111", "1211", "1121", "1112", "11111"]]
  ]);
  marges= new Map<string, number>();
  edits: boolean[] = [];
  zoom: number = 0.5;
  visible = false;
  displayButtons = true;
  modeSolo = false;
  titreSolo = '';
  loading = false;

  @ViewChild("scroll") private scrollDiv!: ElementRef;
  @ViewChildren('screen') screen!: QueryList<ElementRef>;
  @ViewChild('canvas') canvas!: ElementRef;
  @ViewChild('downloadLink') downloadLink!: ElementRef;

  constructor(private route: ActivatedRoute) {
  }

  ngOnInit() {
    //?m=ABC&i=1&p=...
    this.route.queryParamMap.subscribe(params => {
      const marque = params.get('m');
      if (marque) {
        this.lettres = marque;
        this.generate();
        const index = params.get('i');
        if (index) {
          this.zoom = 1;
          this.titreSolo = 'Marque ' + marque + ' variante ' + index;
          this.modeSolo = true;
          const newIndex = +index - 1;
          this.doubleArray = this.doubleArray.slice(newIndex, newIndex + 1);
          const newMarges= new Map<string, number>();
          const marges = params.get('p');
          if (marges) {
            marges.split('|').forEach(marge => {
              const parts = marge.split('=');
              newMarges.set(parts[0], +parts[1]);
            });
          } else {
            for (let marge of this.marges.keys()) {
              if (!marge.startsWith(newIndex + ',')) {
                this.marges.delete(marge);
              } else {
                const parts = marge.split(',');
                parts[0] = '0';
                const key = parts.join(',');
                newMarges.set(key, <number>this.marges.get(marge));
                this.marges.delete(marge);
              }
            }
          }
          this.marges = newMarges;
        }
      }
    })
  }

  downloadImage(index: number, list: string[]){
    const zoomTmp = this.zoom;
    this.zoom = 1;
    this.loading = true;
    setTimeout(() => {
      html2canvas(this.screen.get(index)!.nativeElement, {
        backgroundColor: null
      }).then(canvas => {
        this.canvas.nativeElement.src = canvas.toDataURL();
        this.downloadLink.nativeElement.href = canvas.toDataURL('image/png');
        this.downloadLink.nativeElement.download = 'Marque_' + this.lettres + '_' + (index + 1) + '.png';
        this.downloadLink.nativeElement.click();
        setTimeout(() => {
          this.zoom = zoomTmp;
          this.loading = false;
        });
      });
    }, 100);
  }

  downloadAll() {
    const zoomTmp = this.zoom;
    this.zoom = 1;
    this.displayButtons = false;
    this.loading = true;
    setTimeout(() => {
      html2canvas(this.scrollDiv.nativeElement, {
      }).then(canvas => {
        this.canvas.nativeElement.src = canvas.toDataURL();
        this.downloadLink.nativeElement.href = canvas.toDataURL('image/png');
        this.downloadLink.nativeElement.download = 'Marques_' + this.lettres + '.png';
        this.downloadLink.nativeElement.click();
        setTimeout(() => {
          this.zoom = zoomTmp;
          this.displayButtons = true;
          this.loading = false;
        });
      });
    }, 100);
  }

  fillArray() {
    this.array.length = 0;
    let cpt = 0;
    for (let i of this.chiffres.split('')) {
      this.array.push(this.lettres.substring(cpt, cpt + parseInt(i)));
      cpt += parseInt(i);
    }
  }

  generate() {
    if (this.lettres.length > 1 && this.lettres.length < 6 ) {
      this.visible = true;
      this.doubleArray.length = 0;
      this.marges.clear();
      this.edits.length = 0;
      let word = this.lettres;
      for (let i = 0; i < this.lettres.length; i++) {
        this.generateForWord(word);
        const first = word.charAt(0);
        word = word.substring(1) + first;
      }
      /*setTimeout(() => {
        this.scrollDiv.nativeElement.scrollIntoView({ behavior: "smooth", block: "start" });
      })*/
    }
  }

  private generateForWord(letters: string) {
    let localArray = [];
    for (let position of this.positions.get(letters.length)!) {
      localArray = [];
      let currentPosition = 0;
      for (let i of position.split('')) {
        const subletters = letters.substring(currentPosition, currentPosition + parseInt(i));
        localArray.push(subletters);

        let letterIndex = 0;
        for (let subletter of subletters) {
          const shift = letterIndex > 0 && !this.notShifted.includes(subletter) && !this.notShifted.includes(subletters.charAt(letterIndex - 1));
          this.marges.set(this.doubleArray.length + ',' + (localArray.length - 1) + ',' + letterIndex, shift ? -33 : 0);
          letterIndex++
        }

        currentPosition += parseInt(i);
      }
      this.doubleArray.push(localArray);
      this.edits.push(false);
    }
    // Diagonale
    let cpt = 0;
    localArray = [];
    for (let i of letters) {
      let diag = '';
      for (let j = 0; j < cpt; j++) {
        diag += '_';
        this.marges.set(this.doubleArray.length + ',' + localArray.length + ',' + j, 0);
      }
      diag += i;
      const shift = (diag.length - 1) > 0 && !this.notShifted.includes(i);
      this.marges.set(this.doubleArray.length + ',' + localArray.length + ',' + (diag.length - 1), shift ? -33 : 0);
      localArray.push(diag);
      cpt += 1;
    }
    this.doubleArray.push(localArray);
    this.edits.push(false);
  }

  delete(index: number, element: any) {
    element.style.opacity = '0';
    setTimeout(() => {
      //this.doubleArray.splice(index, 1);
      element.style.display = 'none';
    }, 500)
  }

  deleteEmpty(element: any) {
    element.style.display = 'none';
  }

  move(index1: number, index2: number, index3: number, step: number) {
    const marge = this.marges.get(index1 + ',' + index2 + ',' + index3)!;
    this.marges.set(index1 + ',' + index2 + ',' + index3, marge + step);
  }

  toggleEdit(index: number) {
    this.edits[index] = !this.edits[index];
  }

  changeZoom(step: number) {
    const newZoom = this.zoom + step;
    if (newZoom >= 0.2 && newZoom <= 1) {
      this.zoom = newZoom;
    }
  }

  goToLink(index: number) {
    let location = window.location.href;
    if (location.includes('?')) {
      location = location.substring(0, location.indexOf('?'));
    }
    let marges = '';
    for (let marge of this.marges.keys()) {
      if (marge.startsWith(index + ',')) {
        const parts = marge.split(',');
        parts[0] = '0';
        const key = parts.join(',');
        marges += key + '=' + this.marges.get(marge) + '|';
      }
    }
    window.location.href = location + '?m=' + this.lettres + '&i=' + (index + 1) + '&p=' + marges;
  }

  goBack() {
    window.location.href = window.location.href.substring(0, window.location.href.indexOf('&'));
  }
}
