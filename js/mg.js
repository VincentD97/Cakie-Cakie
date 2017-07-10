function MG(ob, w, h) {
	this.ob = document.getElementById(ob);
	this.w = w || 20;
	this.h = h || 20;
	this.grid_size = 20;		// 迷宫格子宽度，暂时没有用
	this.grid = [];		// 迷宫每个格子的状态，数值为[0, 15]
	this.is_moved = false;		// 用户是否按下过方向键
	this.start = { x: 0, y: 0 };
	this.current = { x: 0, y: 0 };
	this.exit = { x: 19, y: 19 };
	this.init_dir = 1;	// 0: north, 1: east, 2: south, 3: west
	this.me = new MG_Me(this);
	this.path_to_exit = [];
	this.showing_hint = false;
	this.showing_step = false;
	this.create_error = document.getElementById("create_error");
	this.textbox_for_steps_0 = document.getElementById("step_msg_0");
	this.textbox_for_steps = document.getElementById("step_msg");
	this.cake_img = new Image();
	this.cake_imgs = [];
	for ( let i = 0; i < 23; ++i ) {
		let tmp_cake = new Image();
		tmp_cake.src = "img/cake_" + i.toString() + ".jpg";
		tmp_cake.className = "cake_img";
		this.cake_imgs.push( tmp_cake );
	}
	this.margin = 50;
}

MG.prototype = {
	init: function () {
		// 初始化迷宫地图
		this.grid = [];
		for ( var i = 0; i < this.h; ++i ) {
			var tmp = [];
			for ( var j = 0; j < this.w; ++j )
				tmp.push(15);
			this.grid.push(tmp);
		}
		this.showing_hint = false;
		this.showing_step = false;
		
		let random_num = Math.floor(Math.random() * 23);
		this.cake_img = this.cake_imgs[random_num];

		return this;
	},
	set: function ( sets ) {
		// 设置迷宫的宽度与高度
		if ( sets.width ) this.w = sets.width;
		if ( sets.height ) this.h = sets.height;
		return this;
	},
	create: function () {
		// 秘生成迷宫
		var t1, t0 = (new Date()).getTime();
		
		this.init();
		
		this.design();
		this.current = this.start;

		t1 = (new Date()).getTime();
		if ( typeof console != "undefined") {
			console.log("Time used : " + (t1 - t0) + "ms");
		}
		this.create_error.style = "visibility:hidden;";
		return this;
	},
	_update: function ( row, col, dir, val ) {
		var mask = (dir == 'n' ? 1 : ( dir == 'e' ? 2 : ( dir == 's' ? 4 : 8 ) ) );
		if ( val )
			this.grid[row][col] |= mask;
		else
			this.grid[row][col] &= ~mask;
	},
	_read: function ( row, col, dir ) {
		var mask = dir == 'n' ? 1 : ( dir == 'e' ? 2 : ( dir == 's' ? 4 : 8 ) );
		return this.grid[row][col] & mask;
	},
	design: function ()	{
		var m = this.h, n = this.w;
		var L = [], R = [];
		L.length = R.length = 2 * n + 1;
		
		for ( var i = 0; i <= 2 * n; ++i )
			L[i] = R[i] = i;
		L[n] = n - 1;

		
		
		for ( var i = 0; i < m - 1; ++i )
			for ( var j = 0; j < n; ++j ) {
				var k = L[j + 1];
				if ( j != k && Math.floor( Math.random( (new Date()).getMilliseconds() ) * 3 ) ){
					R[k] = R[j];
					L[R[k]] = k;
					R[j] = j + 1;
					L[R[j]] = j;
					this._update(i, j, 'e', 1);
				} else
					this._update(i, j, 'e', 0);
				if ( j != L[j] && Math.floor( Math.random( (new Date()).getMilliseconds() ) * 3 ) ) {
					L[R[j]] = L[j];
					R[L[j]] = R[j];
					L[j] = R[j] = j;
					this._update(i, j, 's', 0);
				} else
					this._update(i, j, 's', 1);
			}
		
		for ( var i = 0; i < n; ++i ) {
			var k = L[i + 1];
			if ( i != k && (i == L[i] || Math.floor( Math.random( (new Date()).getMilliseconds() ) * 3 ) ) )
			{
				R[k] = R[i];
				L[R[k]] = k;
				R[i] = i + 1;
				L[R[i]] = i;
				this._update(m-1, i, 'e', 1);
			} else
				this._update(m-1, i, 'e', 0);
			
			L[R[i]] = L[i];
			R[L[i]] = R[i];
			L[i] = R[i] = i;
		}
		
		for ( var j = 0; j < n; ++j )
			this._update(0, j, 'n', 0);
		for ( var j = 0; j < n; ++j )
			this._update(m-1, j, 's', 0);
		for ( var i = 0; i < m; ++i )
			this._update(i, 0, 'w', 0);
		for ( var i = 0; i < m; ++i )
			this._update(i, n-1, 'e', 0);
		for ( var i = 1; i < m; ++i )
			for ( var j = 0; j < n; ++j )
				this._update(i, j, 'n', this._read(i - 1, j, 's'));
		for ( var i = 0; i < m; ++i )
			for ( var j = 1; j < n; ++j )
				this._update(i, j, 'w', this._read(i, j - 1, 'e'));
		
		// Decide Start and Exit.
		var start_x, start_y;
		var exit_x, exit_y;

		var num;
		do {
			num = Math.floor( Math.random( (new Date()).getMilliseconds() )  * ( 2 * ( m + n ) ) );
		} while ( num == 0 || num == n - 1 || num == n || num == n + m - 1 || num == n + m || num == 2 * n + m - 1 || num == 2 * n + m || num == 2 * ( n + m ) - 1 );
		
		start_x = num < 2 * n + m ? Math.min(Math.max(num - n, 0), m - 1) : (2 * ( m + n ) - 1 - num);
		start_y = num < n ? num : (n - 1 - Math.min(Math.max(num - m - n, 0), n - 1));
		exit_x = m - 1 - start_x;
		exit_y = n - 1 - start_y;
		var dir = !exit_x ? 'n' : (exit_y == n - 1 ? 'e' : (!exit_y ? 'w' : 's'));
		this._update(exit_x, exit_y, dir, 1);
		
		this.start = { x: start_x, y: start_y };
		this.exit = { x: exit_x, y: exit_y };
		let v = this.grid[start_x][start_y]
		var mask = 1;
		for ( let i = 0; i < 4; ++i ) {
			if ( v & mask ) {
				this.init_dir = i;
				break;
			}
			else mask *= 2;
		}
	},
	clear: function () {
		// 清除迷宫上的DOM元素
		this.canvas = null;
		while (this.ob.childNodes[0])
			this.ob.removeChild(this.ob.childNodes[0]);
		return this;
	},
	show: function () {
		// 将迷宫从数据转化为DOM元素并显示在页面上
		var tmp_me = this.me;
		this.clear();
		this.me == tmp_me;

		// 使用canvas显示
		var grid_size = this.grid_size,
			grid = this.grid,
			w = grid_size * this.w,
			h = grid_size * this.h;
		this.ob.style.width = (w + 2 * this.margin) + "px";
		this.ob.style.height = (h + 2 * this.margin) + "px";
		this.ob.style.border = "0";
		this.canvas = document.createElement("canvas");
		this.canvas.setAttribute("width", w + 2 * this.margin);
		this.canvas.setAttribute("height", h + 2 * this.margin);
		this.canvas.setAttribute("style", "border:0;");
		this.ob.appendChild(this.canvas);

		// 在canvas上画图
		var x, y, ix, iy,
			w = this.w,
			h = this.h,
			ctx = this.canvas.getContext("2d");
		this.ctx = ctx;
		ctx.rect(1 + this.margin, 1 + this.margin, w * grid_size - 2, h * grid_size - 2); 
		ctx.stroke();
		for ( var y = 0; y < h; ++y ) 
			for ( var x = 0; x < w; ++x ) {
				var ix = x * grid_size, iy = y * grid_size;
				this.border(ctx, ix, iy, ix + grid_size, iy + grid_size, grid[y][x]);
			}
		ctx.strokeStyle = "white";
		ctx.lineWidth = 5;
		
		let _x1, _y1, _x2, _y2;
		let del = -1;
		let cake_x, cake_y;
		if (this.exit.y == 0)
			[_x1, _y1, _x2, _y2, cake_x, cake_y] = [this.exit.x * grid_size, -del, (this.exit.x + 1) * grid_size, -del, (this.exit.x + 0.5) * this.grid_size + 0.5 * this.margin, 0];
		else if (this.exit.y == this.w - 1)
			[_x1, _y1, _x2, _y2, cake_x, cake_y] = [this.exit.x * grid_size, this.w * grid_size + del, (this.exit.x + 1) * grid_size, this.w * grid_size + del, (this.exit.x + 0.5) * this.grid_size + 0.5 * this.margin, (this.exit.y + 1) * this.grid_size + this.margin];
		else if (this.exit.x == 0)
			[_x1, _y1, _x2, _y2, cake_x, cake_y] = [-del, this.exit.y * grid_size, -del, (this.exit.y + 1) * grid_size, 0, (this.exit.y + 0.5) * this.grid_size + 0.5 * this.margin];
		else if (this.exit.x == this.h - 1)
			[_x1, _y1, _x2, _y2, cake_x, cake_y] = [this.h * grid_size + del, this.exit.y * grid_size, this.h * grid_size, (this.exit.y + 1) * grid_size + del, (this.exit.x + 1) * this.grid_size + this.margin, (this.exit.y + 0.5) * this.grid_size + 0.5 * this.margin];
		this._d(ctx, _y1 + this.margin, _x1 + this.margin, _y2 + this.margin, _x2 + this.margin);
		
		// draw finish cake
		ctx.drawImage(this.cake_img, cake_y + this.margin * .1, cake_x + this.margin * .1, this.margin * .8, this.margin * .8);
		
		let cur_msg_pack = this.me.MSG;
		this.me = new MG_Me(this);
		this.me.MSG = cur_msg_pack;
		return this;
	},
	_d: function ( ctx, x1, y1, x2, y2 ) {
		ctx.beginPath();
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.closePath();
		ctx.stroke();
	},
	border: function ( ctx, ix, iy, ix2, iy2, v ) {
		// MG对象的方法，Canvas方式
		// 根据格子的值显示格子四条边是否可通过
		if ( !v ) {
			ctx.fillRect(ix, iy, ix2, iy2);
			return;
		}

		ctx.strokeStyle = "#222";
		ctx.lineWidth = .3;
		
		if ( !(v & 1) )
			this._d(ctx, ix + this.margin, iy + this.margin, ix2 + this.margin, iy + this.margin);
		if ( !(v & 2) )
			this._d(ctx, ix2 + this.margin, iy + this.margin, ix2 + this.margin, iy2 + this.margin);
		if ( !(v & 4) )
			this._d(ctx, ix + this.margin, iy2 + this.margin, ix2 + this.margin, iy2 + this.margin);
		if ( !(v & 8) )
			this._d(ctx, ix + this.margin, iy + this.margin, ix + this.margin, iy2 + this.margin);
	},
	show_hint: function ( steps_only ) {
		var ctx = this.canvas.getContext("2d");
		function Point( x, y, step ){
			this.x = x;
			this.y = y;
			this.step = step;
		}

		var m = this.h, n = this.w;
		var exit = this.exit;
		var x = this.current.x, y = this.current.y;
		var count = [];
		for ( var i = 0; i < m; ++i ) {
			var tmp = [];
			for ( var j = 0; j < n; ++j )
				tmp.push(0);
			count.push(tmp);				
		}

		count[x][y] = 1;

		var q = [new Point(x, y, 1)];		// queue for points
		while( (q.length)  ) {
			var tmp = q[0];
			if ( tmp.x == exit.x && tmp.y == exit.y ) break;
			var v = this.grid[tmp.x][tmp.y], step_plus1 = tmp.step + 1;
			if ( tmp.x - 1 >= 0 && (v & 1) && !count[tmp.x - 1][tmp.y]) {
				q.push(new Point(tmp.x - 1, tmp.y, step_plus1));
				count[tmp.x - 1][tmp.y] = step_plus1;
			}
			if ( tmp.y + 1 < n && (v & 2) && !count[tmp.x][tmp.y + 1]) {
				q.push(new Point(tmp.x, tmp.y + 1, step_plus1));
				count[tmp.x][tmp.y + 1] = step_plus1;
			}
			if ( tmp.x + 1 < m && (v & 4) && !count[tmp.x + 1][tmp.y]) {
				q.push(new Point(tmp.x + 1, tmp.y, step_plus1));
				count[tmp.x + 1][tmp.y] = step_plus1;
			}
			if ( tmp.y - 1 >= 0 && (v & 8) && !count[tmp.x][tmp.y - 1]) {
				q.push(new Point(tmp.x, tmp.y - 1, step_plus1));
				count[tmp.x][tmp.y - 1] = step_plus1;
			}
			q.shift();
		}
		if ( steps_only ) {
			this.showing_step = true;
			this.textbox_for_steps.style = "visibility:visible;";
			this.textbox_for_steps_0.style = "visibility:visible;";
			this.textbox_for_steps.innerHTML = q[0].step;
		}
		else {
			if (this.showing_hint)
				return;
			this.showing_hint = true;
			var _d = function ( x, y, m ) {
				ctx.beginPath();
				ctx.fillStyle = "#fa0";
				ctx.globalAlpha = 0.8;
				ctx.arc(x + m, y + m, 3, 0, 2 * Math.PI, true);
				ctx.fill();
				ctx.closePath();
				//ctx.stroke();
			};
			var cur_x = exit.x; cur_y = exit.y;
			var grid_size = this.grid_size;
			
			this.path_to_exit = [];
			while ( cur_x != x || cur_y != y ) {
				this.path_to_exit.push([cur_x, cur_y]);
				_d((cur_y + 0.5) * grid_size, (cur_x + 0.5) * grid_size, this.margin);
				var v = this.grid[cur_x][cur_y], desire = count[cur_x][cur_y] - 1;
				if ( cur_x - 1 >= 0 && (v & 1) && count[cur_x - 1][cur_y] == desire )
					cur_x--;
				else if ( cur_y + 1 < n && (v & 2) && count[cur_x][cur_y + 1] == desire )
					cur_y++;
				else if ( cur_x + 1 < m && (v & 4) && count[cur_x + 1][cur_y] == desire )
					cur_x++;
				else if ( cur_y - 1 >= 0 && (v & 8) && count[cur_x][cur_y - 1] == desire )
					cur_y--;
			}
		}
	},
	hide_hint: function ( steps_only ) {
		if (steps_only) {
			this.showing_step = false;
			this.textbox_for_steps.style = "visibility:hidden;";
			this.textbox_for_steps_0.style = "visibility:hidden;";
		} else {
			this.showing_hint = false;
			var ctx = this.canvas.getContext("2d"), grid_size = this.grid_size;;
			var _d = function ( x, y, m ) {
				ctx.beginPath();
				ctx.fillStyle = "#fff";
				ctx.globalAlpha = 1;
				ctx.arc(x + m, y + m, 4, 0, 2 * Math.PI, false);
				ctx.fill();
				ctx.closePath();
			};
			for ( var point of this.path_to_exit )
				_d((point[1] + 0.5) * grid_size, (point[0] + 0.5) * grid_size, this.margin);
		}
	},
	update_create_error: function ( ) {
		 this.create_error.style = "visibility:visible;";
	}
};


// 走迷宫的小人的类
function MG_Me(mg) {
	this.mg = mg || null;
	this.x = mg.current.x;
	this.y = mg.current.y;
	this.is_moving = false;
	this.last_move = new Date();
	this.finished = false;
	this.dirs = {
		north: "img/me_n.jpg",
		east: "img/me_e.jpg",
		south: "img/me_s.jpg",
		west: "img/me_w.jpg"
	};
	this.dir = this.dirs.east;
	this.MSG = MSG_en;

	if ( this.mg ) this.init();
}

MG_Me.prototype = {
	init: function () {
		var tmp_ob = document.createElement("div"),
			tmp_img = document.createElement("img"),
			tmp_info = document.createElement("div"),
			tmp_span = document.createElement("p"),
			_this = this;							// Why ??????????
		this.x = this.mg.start.x;
		this.y = this.mg.start.y;
		switch ( this.mg.init_dir ) {
			case 0:
				this.dir = this.dirs.north;
				break;
			case 1:
				this.dir = this.dirs.east;
				break;
			case 2:
				this.dir = this.dirs.south;
				break;
			case 3:
				this.dir = this.dirs.west;
				break;
		}
		tmp_info.setAttribute("class", "inform");
		tmp_info.setAttribute("className", "inform");
		this.inform_box = tmp_info;
		this.inform_span = tmp_span;
		tmp_info.appendChild(tmp_span);
		tmp_ob.appendChild(tmp_info);		
		tmp_img.setAttribute("src", this.dir);
		this.me_img = tmp_img;
		tmp_ob.setAttribute("class", "me");
		tmp_ob.setAttribute("className", "me");
		tmp_ob.appendChild(tmp_img);
		tmp_ob.style.top = (this.x * this.mg.grid_size + this.mg.margin) + "px";
		tmp_ob.style.left = (this.y * this.mg.grid_size + this.mg.margin) + "px";
		tmp_ob.style.width = this.mg.grid_size + "px";
		tmp_ob.style.height = this.mg.grid_size + "px";
		this.ob = tmp_ob;
		this.mg.ob.appendChild(this.ob);
		$.hotkeys.add("up", function () {
			
			if (_this.mg.showing_hint)
				_this.inform(_this.MSG.must_hide_hint);
			else if (_this.mg.showing_step)
				_this.inform(_this.MSG.must_hide_step);
			else
				_this.move(0); });
		$.hotkeys.add("right", function () {
			if (_this.mg.showing_hint)
				_this.inform(_this.MSG.must_hide_hint);
			else if (_this.mg.showing_step)
				_this.inform(_this.MSG.must_hide_step);
			else
				_this.move(1); });
		$.hotkeys.add("down", function () {
			if (_this.mg.showing_hint)
				_this.inform(_this.MSG.must_hide_hint);
			else if (_this.mg.showing_step)
				_this.inform(_this.MSG.must_hide_step);
			else
				_this.move(2); });
		$.hotkeys.add("left", function () {
			if (_this.mg.showing_hint)
				_this.inform(_this.MSG.must_hide_hint);
			else if (_this.mg.showing_step)
				_this.inform(_this.MSG.must_hide_step);
			else
				_this.move(3); });
		setTimeout(function () {
			if ( _this.mg.is_moved ) return;
			_this.inform(this.MSG.instruction);
		}.bind(this), 3000);
	},
	move: function ( d ) {
		if ( this.is_moving || this.finished) return;
		this.mg.is_moved = true;
		var v = this.mg.grid[this.x][this.y];
		switch ( d ) {
			case 0:
				this.me_img.setAttribute("src", this.dirs.north);
				break;
			case 1:
				this.me_img.setAttribute("src", this.dirs.east);
				break;
			case 2:
				this.me_img.setAttribute("src", this.dirs.south);
				break;
			case 3:
				this.me_img.setAttribute("src", this.dirs.west);
				break;
		}
		if ( v & (1 << d) ) {
			if ( d == 0 )
				this.moveTo(this.x - 1, this.y);
			if ( d == 1 )
				this.moveTo(this.x, this.y + 1);
			if ( d == 2 )
				this.moveTo(this.x + 1, this.y);
			if ( d == 3 )
				this.moveTo(this.x, this.y - 1);
		}
		this.last_move = new Date();
	},
	moveTo: function ( x, y ) {
		this.is_moving = true;
		this.inform();
		
		var top = x * this.mg.grid_size + this.mg.margin,
			left = y * this.mg.grid_size + this.mg.margin,
			_this = this;								////////////////////////////// Why?

		if ( x < 0 || x >= _this.mg.h || y < 0 || y >= _this.mg.w ) {
			top = (top - 25) + "px";
			left = (left - 25) + "px";
		} else {
			top = top + "px";
			left = left + "px";
		}
		this.mg.current = { x: x, y: y };
		if ( x < 0 || x >= _this.mg.h || y < 0 || y >= _this.mg.w ) {
			$(this.ob).animate({
				top: top,
				left: left,
				width: '+=50px',
				height: '+=50px',
			}, 1000, "linear", function () {
				_this.x = x; _this.y = y;
				_this.is_moving = false;
				_this.inform(_this.MSG.win, true);
				_this.finished = true;
			});
		} else {
			$(this.ob).animate({
					top: top,
					left: left
				}, 100, "linear", function () {
					_this.x = x; _this.y = y;
					_this.is_moving = false;
					var v = _this.mg.grid[x][y];
					if ( v == 1 || v == 2 || v == 4 || v == 8 ) {
						_this.inform(_this.MSG.ouch);
					}
				});
		}
	},
	inform: function ( s, isWin = false ) {
		if ( s ) {
			this.inform_box.setAttribute("style", isWin ? "display: none; top: -50px;" : "display: none;");
			$(this.inform_span).html(s);
			$(this.inform_box).fadeIn(500);
		} else {
			$(this.inform_box).fadeOut(500);
		}
	},
	switch_language: function ( toChinese ) {
		if (toChinese)
			this.MSG = MSG_ch;
		else
			this.MSG = MSG_en;
	}
};


