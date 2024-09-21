
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
const frameName = "Screenshot_pivot_export";
const frame = figma.currentPage.findChild(c => c.name == frameName) as FrameNode;

const parse = (frame: FrameNode) => {
    return frame.children.map(obj => {
        const component = obj as ComponentNode
        const width = component.width;
        const height = component.height;
        const ellipse = component.findChild(c => c.name.includes("Ellipse"));

        if ellipse == null {
            return null;
        }

        const rect = new Rect(ellipse.x, ellipse.y, ellipse.width, ellipse.height);
        const pivot = new Point(rect.center.x / width, rect.center.y / height);
        pivot.x = Math.round(pivot.x * 100) / 100;
        pivot.y = Math.round(pivot.y * 100) / 100;

        const info = { name: component.name, pivot: pivot };
        return info;
    });
}

const data = parse(frame);
const json = JSON.stringify({ data: data }, null, 2);
print(json);

