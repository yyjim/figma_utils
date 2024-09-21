const statementPattern = /([astvzqmhlc])([^astvzqmhlc]*)/gi;
const cmdArgSizes = { A: 7, C: 6, H: 1, L: 2, M: 2, Q: 4, S: 4, T: 2, V: 1, Z: 0 };
const numberPattern = /-?[0-9]*\.?[0-9]+(?:e[-+]?\d+)?/gi;
const namePattern = /^(.*?_.*?)_(.*?)_(.*)$/;


// Data Structure
function Point(x, y) {
    this.x = x;
    this.y = y;
}

function Size(width, height) {
    this.width = width;
    this.height = height;
}

// function Rect(x, y, width, height) {
// 		this.x = x
// 		this.y = y
// 		this.width = width
// 		this.height = height
//     this.center = new Point(x + width / 2.0, y + height / 2.0);
// }

class Rect {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  get center() {
    return {
      x: this.x + this.width / 2,
      y: this.y + this.height / 2
    };
  }

  get size() {
    return {
      width: this.width,
      height: this.height
    };
  }

  toObject() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }
}

function Slot(rect, path) {
    this.rect = { x: rect.origin.x, y: rect.origin.y, width: rect.size.width, height: rect.size.height };
    this.path = path;
}

function normalizeRect(rect, size) {
  return {
    x: rect.x / size.width,
    y: rect.y / size.height,
    width: rect.width / size.width,
    height: rect.height / size.height
  };
}

function PhotoFrame(name, size, overlay, slot) {
    this.name = name;
    this.size = size;
		this.overlay = overlay;
    this.slot = slot;
}

function chunkArray(array, chunkSize) {
    const result = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        result.push(array.slice(i, i + chunkSize));
    }
    return result;
}

const removeEmpty = (obj) => {
    Object.keys(obj).forEach((k) => (!obj[k] && obj[k] !== undefined) && delete obj[k]);
    return obj;
};

function parsePath(data: string | null): string {
    if (!data) return;

    const instructions = [];

    // Search for all commands
    let matched: RegExpExecArray | null;
    while ((matched = statementPattern.exec(data)) !== null) {
        let [, cmd, args]: any[] = matched;

        // Convert args to numbers
        args = args.match(numberPattern)?.map(Number) || [];

        // Replace MoveTo with LineTo if more than 1 chunk of args
        if (cmd == 'M' && args.length > cmdArgSizes['M']) cmd = 'L';

        const argSize = cmdArgSizes[cmd];
        if (!argSize) {
            if (args.length > 0) console.error(`Expect zero arg size but got ${args.length} args`);
            instructions.push([cmd]);
            continue;
        }

        if (args.length % argSize) console.error(`Expect args count multiple of ${argSize} but got ${args.length} args`);
        const argChunks = chunkArray(args, argSize);
        for (const argChunk of argChunks) {
            instructions.push([cmd].concat(argChunk));
        }
    }

    // Concat instructions with spaces
    return instructions.flatMap((instruction) => instruction).join(' ');
}


const layouts = figma.currentPage.children.filter(c => c.type === "COMPONENT") as ComponentNode[];

const photo_frames = layouts.map(layout => {
    const name = layout.name;
    const frame = layout.findChild(c => c.name.includes("frame"))!;
		print(frame.name);
    const size = new Size(frame.width, frame.height);
    const slotLayer = layout.findChild(c => c.name.includes("svg"))!;
    const slotRect = new Rect(
			slotLayer.x - frame.x, 
			slotLayer.y - frame.y, 
			slotLayer.width, slotLayer.height
		);
    var path;
    switch slotLayer.type {
        case "VECTOR":
            const vector = slotLayer as Vector;
            path = parsePath(vector?.vectorPaths?.[0].data);
            break;
        default:
            path = null;
            break;
    }
		const slot = {
			"rect": slotRect,
			"normalized_rect": normalizeRect(slotRect, size),
			"path": path
		}

		var overlay;
		const overlayLayer = layout.findChild(c => c.name.includes("frame"));
		if (overlayLayer != null) {
			const overlayLayerRect = new Rect(
				overlayLayer.x - frame.x, 
				overlayLayer.y - frame.y, 
				overlayLayer.width, 
				overlayLayer.height
			);
			overlay = {
				"rect": overlayLayerRect,
				"normalized_rect": normalizeRect(overlayLayerRect, size)
			}
		}
    return new PhotoFrame(name, size, removeEmpty(overlay), removeEmpty(slot));
});

print(photo_frames);


const json = JSON.stringify({ data: removeEmpty(photo_frames) }, null, 2);
print(json);

/*
{
  name: placeholder_01
    size: { width: height: }
		overlay: { 
			rect: { x:y:width:height }
		},
    slot: {
        rect: {x:y:width:,height:},
        path: String
		}
}
*/
