
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

// Main script
const frameName = "thumb";
const frameParent = figma.currentPage.findChild(c => c.name == frameName) as FrameNode;
const frame = frameParent.findChild(c => c.name == 'cover position') as FrameNode;

const parse = (frame: FrameNode) => {
    return frame.children.map(obj => {
        const component = obj as ComponentNode
        const name = obj.name;

        const width = component.width;
        const height = component.height;
        const x = component.x;
        const y = component.y;

        const rect = new Rect(x, y, width, height);
        const pivot = new Point(0.5, 0.5);

        const info = {
            name: component.name, origin: rect.origin, size: rect.size, pivot: pivot
        };
        return info;
    });
}

const data = parse(frame);
const json = JSON.stringify({ data: data }, null, 2);
print(json);

