class MazeGame {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentLevel = 1;
        this.steps = 0;
        this.bombsHit = 0;
        this.score = 0;
        this.path = [];
        this.maze = null;
        this.cellSize = 20;
        this.mazes = this.generateMazes();
        this.solutionPath = null;
        this.showingSolution = false;
        this.setupGame();
    }

    generateMazes() {
        // Tạo 10 mê cung với độ khó tăng dần
        const mazes = [];
        for (let i = 0; i < 10; i++) {
            let maze;
            let attempts = 0;
            do {
                const size = 15 + i * 2; // Kích thước tăng dần theo level
                maze = this.generateMaze(size, size, 5 + i * 2); // Số bom tăng dần theo level
                // Kiểm tra xem mê cung có hợp lệ không
                const path = this.findShortestPath(maze);
                if (path && path.length > 0) {
                    // Kiểm tra xem đường đi có hợp lý không (không quá dài)
                    if (path.length <= size * 2) {
                        break;
                    }
                }
                attempts++;
                if (attempts > 5) {
                    // Nếu không tạo được mê cung hợp lệ sau 5 lần thử, tạo mê cung đơn giản
                    maze = this.generateSimpleMaze(size, size, 5 + i * 2);
                    break;
                }
            } while (true);
            mazes.push(maze);
        }
        return mazes;
    }

    generateMaze(width, height, bombs) {
        // Tạo mê cung trống
        const maze = Array(height).fill().map(() => Array(width).fill(0));
        
        // Tạo tường ngẫu nhiên với tỷ lệ thấp hơn
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (Math.random() < 0.2) { // Giảm tỷ lệ tường từ 0.25 xuống 0.2
                    maze[y][x] = 1;
                }
            }
        }

        // Đặt điểm bắt đầu (2) và kết thúc (3)
        maze[0][0] = 2;
        maze[height-1][width-1] = 3;

        // Đảm bảo có đường đi từ điểm bắt đầu đến điểm kết thúc
        this.ensurePath(maze);

        // Đặt bom (4) sau khi đã có đường đi
        let bombsPlaced = 0;
        const emptyCells = [];
        
        // Tìm tất cả các ô trống
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (maze[y][x] === 0) {
                    emptyCells.push([y, x]);
                }
            }
        }
        
        // Đặt bom vào các ô trống ngẫu nhiên, tránh đặt quá gần điểm bắt đầu và kết thúc
        while (bombsPlaced < bombs && emptyCells.length > 0) {
            const randomIndex = Math.floor(Math.random() * emptyCells.length);
            const [y, x] = emptyCells.splice(randomIndex, 1)[0];
            
            // Kiểm tra khoảng cách với điểm bắt đầu và kết thúc
            const distanceToStart = Math.abs(y) + Math.abs(x);
            const distanceToEnd = Math.abs(y - (height-1)) + Math.abs(x - (width-1));
            
            if (distanceToStart > 2 && distanceToEnd > 2) {
                maze[y][x] = 4;
                bombsPlaced++;
            }
        }

        return maze;
    }

    generateSimpleMaze(width, height, bombs) {
        // Tạo mê cung đơn giản với đường đi rõ ràng
        const maze = Array(height).fill().map(() => Array(width).fill(0));
        
        // Tạo tường ngẫu nhiên với tỷ lệ thấp hơn
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (Math.random() < 0.2) { // Giảm tỷ lệ tường
                    maze[y][x] = 1;
                }
            }
        }

        // Đặt điểm bắt đầu và kết thúc
        maze[0][0] = 2;
        maze[height-1][width-1] = 3;

        // Tạo đường đi đơn giản
        for (let y = 0; y < height; y++) {
            maze[y][0] = 0; // Cột đầu tiên
            maze[y][width-1] = 0; // Cột cuối cùng
        }
        for (let x = 0; x < width; x++) {
            maze[0][x] = 0; // Hàng đầu tiên
            maze[height-1][x] = 0; // Hàng cuối cùng
        }

        // Đặt bom
        let bombsPlaced = 0;
        const emptyCells = [];
        
        // Tìm tất cả các ô trống
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (maze[y][x] === 0) {
                    emptyCells.push([y, x]);
                }
            }
        }
        
        // Đặt bom vào các ô trống ngẫu nhiên
        while (bombsPlaced < bombs && emptyCells.length > 0) {
            const randomIndex = Math.floor(Math.random() * emptyCells.length);
            const [y, x] = emptyCells.splice(randomIndex, 1)[0];
            maze[y][x] = 4;
            bombsPlaced++;
        }

        return maze;
    }

    ensurePath(maze) {
        const height = maze.length;
        const width = maze[0].length;
        const start = [0, 0];
        const end = [height-1, width-1];

        // Tìm đường đi bằng Dijkstra
        const distances = Array(height).fill().map(() => Array(width).fill(Infinity));
        const previous = Array(height).fill().map(() => Array(width).fill(null));
        const visited = Array(height).fill().map(() => Array(width).fill(false));
        distances[start[0]][start[1]] = 0;

        const queue = [[start[0], start[1]]];
        const directions = [[-1, 0], [0, 1], [1, 0], [0, -1]];

        while (queue.length > 0) {
            let minDist = Infinity;
            let minIndex = 0;
            queue.forEach(([y, x], index) => {
                if (distances[y][x] < minDist) {
                    minDist = distances[y][x];
                    minIndex = index;
                }
            });

            const [currentY, currentX] = queue.splice(minIndex, 1)[0];
            
            if (currentY === end[0] && currentX === end[1]) {
                // Đã tìm thấy đường đi
                return;
            }

            visited[currentY][currentX] = true;

            for (const [dy, dx] of directions) {
                const newY = currentY + dy;
                const newX = currentX + dx;

                if (newY < 0 || newY >= height || newX < 0 || newX >= width || 
                    maze[newY][newX] === 1 || visited[newY][newX]) {
                    continue;
                }

                const newDist = distances[currentY][currentX] + 1;
                if (newDist < distances[newY][newX]) {
                    distances[newY][newX] = newDist;
                    previous[newY][newX] = [currentY, currentX];
                    queue.push([newY, newX]);
                }
            }
        }

        // Nếu không tìm thấy đường đi, tạo một đường đi
        let current = end;
        while (current !== null) {
            const [y, x] = current;
            maze[y][x] = 0; // Xóa tường nếu có
            
            // Tìm ô lân cận gần điểm bắt đầu nhất
            let nextCell = null;
            let minDist = Infinity;
            
            for (const [dy, dx] of directions) {
                const newY = y + dy;
                const newX = x + dx;
                
                if (newY < 0 || newY >= height || newX < 0 || newX >= width) {
                    continue;
                }
                
                const dist = Math.abs(newY - start[0]) + Math.abs(newX - start[1]);
                if (dist < minDist) {
                    minDist = dist;
                    nextCell = [newY, newX];
                }
            }
            
            if (nextCell === null || (nextCell[0] === start[0] && nextCell[1] === start[1])) {
                break;
            }
            
            current = nextCell;
        }
    }

    setupGame() {
        this.container.innerHTML = '';
        const gameDiv = document.createElement('div');
        gameDiv.className = 'maze-game';
        
        // Thêm hướng dẫn chơi game
        const instructions = document.createElement('div');
        instructions.className = 'game-instructions';
        instructions.innerHTML = `
            <h3>Hướng dẫn chơi:</h3>
            <ul>
                <li>Bắt đầu từ ô màu xanh lá (điểm xuất phát)</li>
                <li>Di chuyển đến ô màu đỏ (đích)</li>
                <li>Tránh các ô màu cam (bom) nếu có thể</li>
                <li>Chỉ có thể di chuyển sang các ô liền kề</li>
                <li>Không thể đi qua tường (ô đen)</li>
            </ul>
        `;
        
        // Tạo thanh công cụ
        const toolbar = document.createElement('div');
        toolbar.className = 'maze-toolbar';
        
        // Tạo level selector với event listener trực tiếp
        const levelSelector = document.createElement('div');
        levelSelector.className = 'level-selector';
        for (let i = 0; i < 10; i++) {
            const levelBtn = document.createElement('button');
            levelBtn.className = `level-btn ${i + 1 === this.currentLevel ? 'active' : ''}`;
            levelBtn.textContent = `Level ${i + 1}`;
            levelBtn.addEventListener('click', () => this.selectLevel(i + 1));
            levelSelector.appendChild(levelBtn);
        }
        
        toolbar.innerHTML = `
            <div class="game-stats">
                <span>Current Level: ${this.currentLevel}</span>
                <span>Steps: ${this.steps}</span>
                <span>Bombs Hit: ${this.bombsHit}</span>
                <span>Score: ${this.score}</span>
            </div>
            <div class="game-controls">
                <button onclick="mazeGame.resetPath()">Reset Path</button>
                <button class="solution-btn" onclick="mazeGame.showSolution()">Show Solution</button>
            </div>
        `;
        toolbar.insertBefore(levelSelector, toolbar.firstChild);
        
        // Tạo khu vực mê cung
        const mazeDiv = document.createElement('div');
        mazeDiv.className = 'maze-grid';
        this.maze = this.mazes[this.currentLevel - 1];
        
        // Set grid size based on maze dimensions
        mazeDiv.style.gridTemplateColumns = `repeat(${this.maze[0].length}, ${this.cellSize}px)`;
        mazeDiv.style.gridTemplateRows = `repeat(${this.maze.length}, ${this.cellSize}px)`;
        
        for (let y = 0; y < this.maze.length; y++) {
            for (let x = 0; x < this.maze[0].length; x++) {
                const cell = document.createElement('div');
                cell.className = 'maze-cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                
                switch(this.maze[y][x]) {
                    case 1: cell.classList.add('wall'); break;
                    case 2: cell.classList.add('start'); break;
                    case 3: cell.classList.add('end'); break;
                    case 4: cell.classList.add('bomb'); break;
                }
                
                cell.addEventListener('mouseover', () => this.highlightAvailableMoves(x, y));
                cell.addEventListener('mouseout', () => this.clearHighlights());
                cell.addEventListener('click', () => this.handleCellClick(x, y));
                mazeDiv.appendChild(cell);
            }
        }
        
        gameDiv.appendChild(instructions);
        gameDiv.appendChild(toolbar);
        gameDiv.appendChild(mazeDiv);
        this.container.appendChild(gameDiv);

        // Highlight các ô có thể đi được từ điểm bắt đầu
        if (this.path.length === 0) {
            this.highlightAvailableMoves(0, 0);
        }
    }

    highlightAvailableMoves(x, y) {
        // Chỉ hiển thị các ô có thể đi được nếu ô hiện tại là điểm cuối của đường đi hoặc là điểm bắt đầu
        if ((this.path.length === 0 && this.maze[y][x] === 2) || 
            (this.path.length > 0 && this.path[this.path.length - 1][1] === x && this.path[this.path.length - 1][0] === y)) {
            
            const directions = [[-1, 0], [0, 1], [1, 0], [0, -1]];
            directions.forEach(([dy, dx]) => {
                const newY = y + dy;
                const newX = x + dx;
                
                if (newY >= 0 && newY < this.maze.length && 
                    newX >= 0 && newX < this.maze[0].length && 
                    this.maze[newY][newX] !== 1) {
                    
                    const cell = this.container.querySelector(`[data-x="${newX}"][data-y="${newY}"]`);
                    if (!cell.classList.contains('path')) {
                        cell.classList.add('available');
                    }
                }
            });
        }
    }

    clearHighlights() {
        const cells = this.container.querySelectorAll('.available');
        cells.forEach(cell => cell.classList.remove('available'));
    }

    handleCellClick(x, y) {
        if (this.maze[y][x] === 1) {
            // Hiển thị thông báo khi đi vào tường
            alert('Không thể đi qua tường!');
            return;
        }
        
        const cell = this.container.querySelector(`[data-x="${x}"][data-y="${y}"]`);
        
        // Nếu click vào ô đã có trong đường đi
        if (cell.classList.contains('path')) {
            // Xóa đường đi từ điểm này trở đi
            const index = this.path.findIndex(([py, px]) => px === x && py === y);
            if (index !== -1) {
                const removedCells = this.path.splice(index);
                removedCells.forEach(([py, px]) => {
                    const pathCell = this.container.querySelector(`[data-x="${px}"][data-y="${py}"]`);
                    pathCell.classList.remove('path');
                    pathCell.classList.remove('current');
                });
                this.steps = this.path.length;
                this.bombsHit = this.path.filter(([py, px]) => this.maze[py][px] === 4).length;
                this.updateStats();
            }
        } else {
            // Thêm điểm mới vào đường đi
            if (this.path.length === 0) {
                // Chỉ có thể bắt đầu từ điểm xuất phát
                if (this.maze[y][x] !== 2) {
                    alert('Bạn phải bắt đầu từ ô màu xanh lá!');
                    return;
                }
            } else {
                // Kiểm tra xem có thể đi đến ô mới không
                const [lastY, lastX] = this.path[this.path.length - 1];
                if (Math.abs(x - lastX) + Math.abs(y - lastY) !== 1) {
                    alert('Chỉ có thể di chuyển sang ô liền kề!');
                    return;
                }
            }
            
            // Xóa trạng thái current từ ô trước đó
            if (this.path.length > 0) {
                const [prevY, prevX] = this.path[this.path.length - 1];
                const prevCell = this.container.querySelector(`[data-x="${prevX}"][data-y="${prevY}"]`);
                prevCell.classList.remove('current');
            }
            
            this.path.push([y, x]);
            cell.classList.add('path');
            cell.classList.add('current'); // Đánh dấu ô hiện tại
            
            // Hiệu ứng khi đi qua bom
            if (this.maze[y][x] === 4) {
                this.bombsHit++;
                this.score -= 10;
                cell.classList.add('bomb-hit');
                setTimeout(() => cell.classList.remove('bomb-hit'), 500);
            }
            
            this.steps++;
            
            // Khi đến đích
            if (this.maze[y][x] === 3) {
                // Hoàn thành level
                this.score += 100 - this.steps - (this.bombsHit * 10);
                
                // Hiệu ứng hoàn thành
                this.path.forEach(([py, px], index) => {
                    const pathCell = this.container.querySelector(`[data-x="${px}"][data-y="${py}"]`);
                    setTimeout(() => {
                        pathCell.classList.add('complete');
                    }, index * 100);
                });
                
                setTimeout(() => {
                    alert(`Level ${this.currentLevel} completed!\nScore: ${this.score}`);
                    if (this.currentLevel < 10) {
                        this.currentLevel++;
                        this.resetGame();
                    }
                }, this.path.length * 100);
            }
            
            this.updateStats();
        }
        
        // Cập nhật hiển thị các ô có thể đi
        this.clearHighlights();
        this.highlightAvailableMoves(x, y);
    }

    selectLevel(level) {
        if (level < 1 || level > 10) return;
        
        // Cập nhật level hiện tại
        this.currentLevel = level;
        
        // Reset các biến trạng thái
        this.path = [];
        this.steps = 0;
        this.bombsHit = 0;
        this.score = 0;
        
        // Lấy mê cung cho level được chọn
        this.maze = this.mazes[level - 1];
        
        // Thiết lập lại game với level mới
        this.setupGame();
        
        // Cập nhật UI
        const levelBtns = document.querySelectorAll('.level-btn');
        levelBtns.forEach((btn, i) => {
            btn.classList.toggle('active', i + 1 === level);
        });
    }

    resetGame() {
        // Reset các biến trạng thái
        this.path = [];
        this.steps = 0;
        this.bombsHit = 0;
        this.score = 0;
        
        // Tạo lại mê cung cho level hiện tại
        this.maze = this.mazes[this.currentLevel - 1];
        
        // Thiết lập lại game
        this.setupGame();
        
        // Cập nhật UI
        this.updateStats();
    }

    resetPath() {
        this.path = [];
        this.steps = 0;
        this.bombsHit = 0;
        const pathCells = this.container.querySelectorAll('.path');
        pathCells.forEach(cell => cell.classList.remove('path'));
        this.updateStats();
    }

    findShortestPath(maze) {
        const height = maze.length;
        const width = maze[0].length;
        const start = [0, 0];  // [y, x]
        const end = [height-1, width-1];  // [y, x]

        // Khởi tạo khoảng cách và đường đi
        const distances = Array(height).fill().map(() => Array(width).fill(Infinity));
        const previous = Array(height).fill().map(() => Array(width).fill(null));
        const visited = Array(height).fill().map(() => Array(width).fill(false));
        distances[start[0]][start[1]] = 0;

        // Hàng đợi ưu tiên đơn giản
        const queue = [[start[0], start[1]]];  // [y, x]

        // Các hướng di chuyển có thể: lên, phải, xuống, trái
        const directions = [[-1, 0], [0, 1], [1, 0], [0, -1]];

        while (queue.length > 0) {
            // Tìm điểm có khoảng cách nhỏ nhất trong hàng đợi
            let minDist = Infinity;
            let minIndex = 0;
            queue.forEach(([y, x], index) => {
                if (distances[y][x] < minDist) {
                    minDist = distances[y][x];
                    minIndex = index;
                }
            });

            const [currentY, currentX] = queue.splice(minIndex, 1)[0];
            
            // Nếu đã đến đích
            if (currentY === end[0] && currentX === end[1]) {
                break;
            }

            // Đánh dấu đã thăm
            visited[currentY][currentX] = true;

            // Kiểm tra các ô lân cận
            for (const [dy, dx] of directions) {
                const newY = currentY + dy;
                const newX = currentX + dx;

                // Kiểm tra giới hạn và tường
                if (newY < 0 || newY >= height || newX < 0 || newX >= width || 
                    maze[newY][newX] === 1 || visited[newY][newX]) {
                    continue;
                }

                // Tính khoảng cách mới
                let newDist = distances[currentY][currentX] + 1;
                // Thêm phạt nếu đi qua bom
                if (maze[newY][newX] === 4) {
                    newDist += 10;
                }

                // Cập nhật khoảng cách nếu tìm thấy đường đi ngắn hơn
                if (newDist < distances[newY][newX]) {
                    distances[newY][newX] = newDist;
                    previous[newY][newX] = [currentY, currentX];
                    queue.push([newY, newX]);
                }
            }
        }

        // Tạo đường đi từ mảng previous
        const path = [];
        let current = end;
        while (current !== null) {
            path.unshift(current);
            current = previous[current[0]][current[1]];
        }

        return path;
    }

    showSolution() {
        if (this.showingSolution) {
            // Nếu đang hiển thị solution, quay lại đường đi của người dùng
            this.showingSolution = false;
            this.solutionPath = null;
            
            // Xóa đường đi tối ưu và các class liên quan
            const allCells = this.container.querySelectorAll('.maze-cell');
            allCells.forEach(cell => {
                cell.classList.remove('solution', 'better-path', 'worse-path', 'has-solution', 'matching-path');
            });
            
            // Hiển thị lại đường đi của người dùng
            this.path.forEach(([y, x]) => {
                const cell = this.container.querySelector(`[data-x="${x}"][data-y="${y}"]`);
                cell.classList.add('path');
            });

            // Cập nhật nút
            const solutionButton = this.container.querySelector('.solution-btn');
            if (solutionButton) {
                solutionButton.textContent = 'Show Solution';
            }
        } else {
            // Tìm đường đi tối ưu
            this.solutionPath = this.findShortestPath(this.maze);
            this.showingSolution = true;

            // Tính điểm của đường đi tối ưu
            const optimalScore = 100 - this.solutionPath.length - 
                (this.solutionPath.filter(([y, x]) => this.maze[y][x] === 4).length * 10);

            // Tính điểm của đường đi hiện tại
            const currentScore = this.path.length > 0 ? 
                100 - this.path.length - (this.bombsHit * 10) : 0;

            // Đánh dấu điểm bắt đầu và kết thúc
            const startCell = this.container.querySelector(`[data-x="0"][data-y="0"]`);
            const endCell = this.container.querySelector(`[data-x="${this.maze[0].length-1}"][data-y="${this.maze.length-1}"]`);
            startCell.classList.add('has-solution');
            endCell.classList.add('has-solution');

            // Hiển thị đường đi tối ưu với màu khác
            this.solutionPath.forEach(([y, x]) => {
                const cell = this.container.querySelector(`[data-x="${x}"][data-y="${y}"]`);
                
                // So sánh với đường đi của người dùng
                if (this.path.some(([py, px]) => py === y && px === x)) {
                    cell.classList.add('solution', 'matching-path');
                } else {
                    cell.classList.add('solution');
                    if (currentScore < optimalScore) {
                        cell.classList.add('better-path');
                    }
                }
            });

            // Đánh dấu các ô trong đường đi của người dùng không nằm trong đường đi tối ưu
            if (this.path.length > 0) {
                this.path.forEach(([y, x]) => {
                    const cell = this.container.querySelector(`[data-x="${x}"][data-y="${y}"]`);
                    if (!this.solutionPath.some(([sy, sx]) => sy === y && sx === x)) {
                        cell.classList.add('worse-path');
                    }
                });
            }

            // Hiển thị thông tin so sánh
            const comparison = document.createElement('div');
            comparison.className = 'path-comparison';
            comparison.innerHTML = `
                <div class="comparison-info">
                    <p>Đường đi tối ưu: ${this.solutionPath.length} bước</p>
                    <p>Đường đi của bạn: ${this.path.length || 'Chưa hoàn thành'}</p>
                    <p>Điểm tối ưu có thể đạt: ${optimalScore}</p>
                    <p>Điểm hiện tại của bạn: ${currentScore}</p>
                </div>
            `;

            // Thêm hoặc cập nhật thông tin so sánh
            const existingComparison = this.container.querySelector('.path-comparison');
            if (existingComparison) {
                existingComparison.replaceWith(comparison);
            } else {
                this.container.querySelector('.maze-game').insertBefore(
                    comparison,
                    this.container.querySelector('.maze-grid')
                );
            }

            // Cập nhật nút
            const solutionButton = this.container.querySelector('.solution-btn');
            if (solutionButton) {
                solutionButton.textContent = 'Hide Solution';
            }
        }
    }

    updateStats() {
        const stats = this.container.querySelector('.game-stats');
        stats.innerHTML = `
            <span>Current Level: ${this.currentLevel}</span>
            <span>Steps: ${this.steps}</span>
            <span>Bombs Hit: ${this.bombsHit}</span>
            <span>Score: ${this.score}</span>
        `;
    }
} 