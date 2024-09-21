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

function Rect(x, y, width, height) {
    this.origin = new Point(x, y);
    this.size = new Size(width, height);
    this.center = new Point(x + width / 2.0, y + height / 2.0);
}

function Slot(rect, path) {
    this.rect = { x: rect.origin.x, y: rect.origin.y, width: rect.size.width, height: rect.size.height };
    this.path = path;
}

function PhotoFrame(name, size, slot) {
    this.name = name;
    this.size = size;
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

const frameName = "slot";
const frames = figma.currentPage.findChild(c => c.type === "FRAME") as FrameNode;

print(frames);

const layouts = frames.children.flatMap.children.filter(c => c.type === "COMPONENT") as ComponentNode[];

const photo_frames = layouts.map(layout => {
    const name = layout.name;
    const frame = layout
    const size = new Size(frame.width, frame.height);
    print(size);
    const svg = layout.findChild(c => c.name.includes("svg"));
    const rect = new Rect(svg.x, svg.y, svg.width, svg.height);
    var path;
    switch svg.type {
        case "VECTOR":
            const vector = svg as Vector;
            path = parsePath(vector?.vectorPaths?.[0].data);
            break;
        default:
            path = null;
            break;
    }
    const slot = removeEmpty({
        "rect": { "x": rect.origin.x, "y": rect.origin.y, "width": rect.size.width, "height": rect.size.height }
    });
    return new PhotoFrame(name, size, removeEmpty(slot));
});


const json = JSON.stringify({ data: removeEmpty(photo_frames) }, null, 2);
print(json);

/*
{
    name: String
    size: { width: height: }
    slot: {
        rect: {x:y:width:,height:},
}
*/
