import {
  Component,
  ElementRef,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren
} from '@angular/core';
import {ActivatedRoute, RouterOutlet} from '@angular/router';
import {FormsModule} from "@angular/forms";
import {JsonPipe, NgClass, NgStyle} from "@angular/common";
import html2canvas from "html2canvas";

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
  indexSolo: string | null = null;
  filtre = '';
  filtreVisible = false;

  @ViewChild("scroll") private scrollDiv!: ElementRef;
  @ViewChildren('screen') screen!: QueryList<ElementRef>;
  @ViewChild('canvas') canvas!: ElementRef;
  @ViewChild('downloadLink') downloadLink!: ElementRef;

  constructor(private route: ActivatedRoute) {
  }

  ngOnInit() {
    // Parse query params
    this.route.queryParamMap.subscribe(params => {
      const marque = params.get('m');
      if (marque) {
        this.lettres = marque;
        this.loading = true;
        setTimeout(() => {
          this.generate();
          this.indexSolo = params.get('i');
          if (this.indexSolo) {
            this.zoom = 1;
            this.titreSolo = 'Marque ' + marque + ' variante ' + this.indexSolo;
            this.modeSolo = true;
            const newIndex = +this.indexSolo - 1;
            this.doubleArray = this.doubleArray.slice(newIndex, newIndex + 1);
            const newMarges = new Map<string, number>();
            const marges = params.get('p');
            if (marges) {
              marges.split('|').forEach(marge => {
                if (marge) {
                  const parts = marge.split('=');
                  newMarges.set(parts[0], +parts[1]);
                }
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
        });
      }
    })
  }

  downloadImage(index: number, scale: boolean){
    const zoomTmp = this.zoom;
    this.zoom = 1;
    this.loading = true;
    const width = this.screen.get(index)!.nativeElement.offsetWidth;
    const height = this.screen.get(index)!.nativeElement.offsetHeight;
    if (scale) {
      if (width > height) {
        this.screen.get(index)!.nativeElement.style.transform = 'scale(' + 200 / width + ')';
      } else {
        this.screen.get(index)!.nativeElement.style.transform = 'scale(' + 200 / height + ')';
      }
    }
    setTimeout(() => {
      html2canvas(this.screen.get(index)!.nativeElement, {
        backgroundColor: null
      }).then(canvas => {
        this.canvas.nativeElement.src = canvas.toDataURL();
        this.downloadLink.nativeElement.href = canvas.toDataURL('image/png');
        this.downloadLink.nativeElement.download = 'Marque_' + this.lettres + '_' + (this.indexSolo ? this.indexSolo : index + 1) + '.png';
        this.downloadLink.nativeElement.click();
        setTimeout(() => {
          this.zoom = zoomTmp;
          this.loading = false;
          if (scale) {
            this.screen.get(index)!.nativeElement.style.removeProperty('transform');
          }
        });
      });
    }, 100);
  }

  downloadAll() {
    const zoomTmp = this.zoom;
    this.zoom = 1;
    this.displayButtons = false;
    this.loading = true;
    const nbElements = this.getTotalNumberDisplayed();
    if (nbElements < 50) {
      this.scrollDiv.nativeElement.classList.add("scale3");
    } else if (nbElements < 1000) {
      this.scrollDiv.nativeElement.classList.add("scale4");
    } else {
      this.scrollDiv.nativeElement.classList.add("scale5");
    }

    setTimeout(() => {
      html2canvas(this.scrollDiv.nativeElement, {
      }).then((canvas: HTMLCanvasElement) => {
        this.canvas.nativeElement.src = canvas.toDataURL();
        this.downloadLink.nativeElement.href = canvas.toDataURL('image/png');
        this.downloadLink.nativeElement.download = 'Marques_' + this.lettres + '.png';
        this.downloadLink.nativeElement.click();
        setTimeout(() => {
          this.zoom = zoomTmp;
          this.displayButtons = true;
          this.loading = false;
          this.scrollDiv.nativeElement.classList.remove("scale3");
          this.scrollDiv.nativeElement.classList.remove("scale4");
          this.scrollDiv.nativeElement.classList.remove("scale5");
        });
      });
    }, 100);
  }

  permut(string: string): string[] {
    if (string.length < 2) return [string]; // This is our break condition

    var permutations = []; // This array will hold our permutations
    for (var i = 0; i < string.length; i++) {
      var char = string[i];

      // Cause we don't want any duplicates:
      if (string.indexOf(char) != i) // if char was used already
        continue; // skip it this time

      var remainingString = string.slice(0, i) + string.slice(i + 1, string.length); //Note: you can concat Strings via '+' in JS

      for (var subPermutation of this.permut(remainingString))
        permutations.push(char + subPermutation)
    }
    return permutations;
  }

  generateWithLoading() {
    this.loading = true;
    setTimeout(() => {
      this.generate();
    });
  }

  generate() {
    if (this.lettres.length > 1 && this.lettres.length < 6 ) {
      this.lettres = this.lettres.split("").sort().join("");
      this.visible = true;
      this.doubleArray.length = 0;
      this.marges.clear();
      this.edits.length = 0;
      this.filtre = '';
      const array = this.permut(this.lettres);
      for (let permutation of array) {
        this.generateForWord(permutation);
      }
      setTimeout(() => {
        this.loading = false;
      });
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
    if (this.indexSolo && !this.edits[index]) {
      this.goToLink(+this.indexSolo - 1);
    }
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
      if (!this.modeSolo) {
        if (marge.startsWith(index + ',')) {
          const parts = marge.split(',');
          parts[0] = '0';
          const key = parts.join(',');
          marges += key + '=' + this.marges.get(marge) + '|';
        }
      } else {
        marges += marge + '=' + this.marges.get(marge) + '|';
      }
    }
    window.location.href = location + '?m=' + this.lettres + '&i=' + (index + 1) + '&p=' + marges;
  }

  goBack() {
    window.location.href = window.location.href.substring(0, window.location.href.indexOf('&'));
  }

  getTotalNumberDisplayed() {
    if (this.filtre) {
      return this.doubleArray.filter(d => d.join('').replaceAll('_', '').includes(this.filtre)).length;
    } else {
      return this.doubleArray.length
    }
  }

  toggleFilter() {
    if (this.filtreVisible) {
      this.filtre = '';
    }
    this.filtreVisible = !this.filtreVisible
  }
}
