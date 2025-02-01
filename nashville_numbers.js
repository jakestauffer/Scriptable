class Chord {
    constructor(key, chord) {
        this.key = key;
        this.originalChord = chord;

        const notes = chord.split("/");
        const fullRoot = notes[0] || null;
        const fullBass = notes[1] || null;

        this.root = fullRoot ? fullRoot.match(/[A-G#b]+/g)?.[0] : null;
        this.sharpFlat = fullRoot ? fullRoot.match(/[#b]/g)?.[0] : null;
        this.bass = fullBass ? new Chord(key, fullBass) : null;
        this.isMinor = fullRoot?.includes('m') && !fullRoot.includes("maj");
        this.extension = fullRoot ? fullRoot.match(/\d+/g)?.[0] : null;

        this.nashvilleNumber = this.bass
            ? `${this.getNashvilleNumber()}/${this.bass.getNashvilleNumber()}`
            : this.getNashvilleNumber();
    }

    getNashvilleNumber() {
        if (!this.root) return null;

        const keyChords = MusicConstants.KeysWithChords[this.key];
        const rootIndex = keyChords.indexOf(this.root);
       
        let nashvilleNumber = "";
       
        if (rootIndex >= 0) {
            nashvilleNumber = `${rootIndex + 1}`;
        } else if (this.sharpFlat) {
            const accidentalIndex = this.handleAccidental(keyChords);
            if (accidentalIndex >= 0) {
                nashvilleNumber = `${this.sharpFlat}${accidentalIndex + 1}`;
            }
        }

        if (!nashvilleNumber) return null;
        if (this.isMinor) nashvilleNumber += "m";
        if (this.extension) nashvilleNumber += `(${this.extension})`;

        return nashvilleNumber;
    }

    handleAccidental(keyChords) {
        const noteWithoutSharpFlat = this.root.replace(this.sharpFlat, "");
        return keyChords.indexOf(noteWithoutSharpFlat);
    }
}

const MusicConstants = {
    KeysWithChords: {
        C: ["C", "D", "E", "F", "G", "A", "B"],
        G: ["G", "A", "B", "C", "D", "E", "F#"],
        D: ["D", "E", "F#", "G", "A", "B", "C#"],
        A: ["A", "B", "C#", "D", "E", "F#", "G#"],
        E: ["E", "F#", "G#", "A", "B", "C#", "D#"],
        B: ["B", "C#", "D#", "E", "F#", "G#", "A#"],
        F: ["F", "G", "A", "Bb", "C", "D", "E"],
        Bb: ["Bb", "C", "D", "Eb", "F", "G", "A"],
        Eb: ["Eb", "F", "G", "Ab", "Bb", "C", "D"],
        Ab: ["Ab", "Bb", "C", "Db", "Eb", "F", "G"],
        Db: ["Db", "Eb", "F", "Gb", "Ab", "Bb", "C"],
        Gb: ["Gb", "Ab", "Bb", "Cb", "Db", "Eb", "F"],
    }
};

async function getUserInput(promptText) {
    let alert = new Alert();
    alert.title = "Nashville Numbers Converter";
    alert.addTextField(promptText, "");
    alert.addAction("OK");
    await alert.present();
    return alert.textFieldValue(0);
}

async function main() {
    let key = await getUserInput("Enter the key of the song:");
    let chordsInput = await getUserInput("Enter the chords (comma separated):");
    let chords = chordsInput.split(",").map(chord => chord.trim());
   
    let convertedChords = chords.map(chord => new Chord(key, chord).nashvilleNumber);
   
    let output = chords.map((chord, index) => `${chord} => ${convertedChords[index]}`).join("\n");
   
    let resultAlert = new Alert();
    resultAlert.title = "Converted Chords";
    resultAlert.message = output;
    resultAlert.addAction("OK");
    await resultAlert.present();
}

main();
