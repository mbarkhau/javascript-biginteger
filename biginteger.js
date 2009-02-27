// BigInteger():            get BigInteger.ZERO
// BigInteger("123"):       create a new BigInteger with value 123
// BigInteger(123):         create a new BigInteger with value 123
// BigInteger(something):   convert something to a BigInteger if it's not already

// Don't call these:
// new BigInteger(n):           create a new BigInteger from n (duh!). Prefer function call over this.
// new BigInteger([3,2,1], -1): create a new BigInteger with value -123. For internal use.
function BigInteger(n, s) {
	if (!(this instanceof BigInteger)) {
		if (n instanceof BigInteger) {
			return n;
		}
		else if (n === undefined) {
			return BigInteger.ZERO;
		}
		return BigInteger.parse(n);
	}

	if (n instanceof BigInteger) {
		this._d = n._d.slice();
		this._s = n._s;
	}
	else if (s !== undefined) {
		while (n.length && !n[n.length - 1]) {
			--n.length;
		}
		this._d = n;
		this._s = n.length ? s : 0;
	}
	else {
		throw new Error("Invalid argument for new BigInteger (call as a function instead)");
	}
	// Keep editor from complaining about not returning
	return undefined;
};

BigInteger.ZERO = new BigInteger([], 0);
BigInteger.ONE = new BigInteger([1], 1);
BigInteger.M_ONE = new BigInteger(BigInteger.ONE._d, -1);
BigInteger._0 = BigInteger.ZERO;
BigInteger._1 = BigInteger.ONE;
BigInteger.digits = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

BigInteger.prototype.toString = function(base) {
	base = base || 10;
	if (base < 2 || base > 36) {
		throw new Error("illegal radix " + base + ".");
	}
	if (this.isZero()) {
		return "0";
	}
	if (base == 10) {
		// [].reverse() modifies the array, so we need to copy if first
		return (this._s < 0 ? "-" : "") + (this._d.slice().reverse().join("") || "0");
	}
	else {
		var numerals = BigInteger.digits;
		base = BigInteger(base);
		var sign = this._s;

		var n = this.abs();
		var digits = [];
		var digit;

		while (!n.isZero()) {
			var divmod = n.divMod(base);
			n = divmod[0];
			digit = divmod[1];
			// TODO: This could be changed to unshift instead of reversing at the end.
			// Benchmark both to compare speeds.
			digits.push(numerals[digit]);
		}
		return (sign < 0 ? "-" : "") + digits.reverse().join("");
	}
};

// BigIntegers from 0 to 36 (used for parsing up to base 36, but useful when you need a "small" BigInteger)
BigInteger.small = [
	BigInteger.ZERO,
	BigInteger.ONE,
	new BigInteger(  [2], 1),
	new BigInteger(  [3], 1),
	new BigInteger(  [4], 1),
	new BigInteger(  [5], 1),
	new BigInteger(  [6], 1),
	new BigInteger(  [7], 1),
	new BigInteger(  [8], 1),
	new BigInteger(  [9], 1),
	new BigInteger([0,1], 1),
	new BigInteger([1,1], 1),
	new BigInteger([2,1], 1),
	new BigInteger([3,1], 1),
	new BigInteger([4,1], 1),
	new BigInteger([5,1], 1),
	new BigInteger([6,1], 1),
	new BigInteger([7,1], 1),
	new BigInteger([8,1], 1),
	new BigInteger([9,1], 1),
	new BigInteger([0,2], 1),
	new BigInteger([1,2], 1),
	new BigInteger([2,2], 1),
	new BigInteger([3,2], 1),
	new BigInteger([4,2], 1),
	new BigInteger([5,2], 1),
	new BigInteger([6,2], 1),
	new BigInteger([7,2], 1),
	new BigInteger([8,2], 1),
	new BigInteger([9,2], 1),
	new BigInteger([0,3], 1),
	new BigInteger([1,3], 1),
	new BigInteger([2,3], 1),
	new BigInteger([3,3], 1),
	new BigInteger([4,3], 1),
	new BigInteger([5,3], 1),
	new BigInteger([6,3], 1)
];

BigInteger.parse = function(s, base) {
	// Expands a number in exponential form to decimal form.
	// expandExponential("-13.441*10^5") ===  "1344100"
	// expandExponential("1.12300e-1") === "0.112300";
	// expandExponential(1000000000000000000000000000000) === "1000000000000000000000000000000";
	function expandExponential(str) {
		str = str.replace(/\s*[*xX]\s*10\s*(\^|\*\*)\s*/, "e");

		return str.replace(/^([+-])?(\d+)\.?(\d*)[eE]([-+]?\d+)$/, function(x, s, n, f, c) {
			var l = +c < 0;
			var i = n.length + +c;
			x = (l ? n : f).length,
			c = ((c = Math.abs(c)) >= x ? c - x + l : 0),
			z = (new Array(c + 1)).join("0"), r = n + f;
			return (s || "") + (l ? r = z + r : r += z).substr(0, i += l ? z.length : 0) + (i < r.length ? "." + r.substr(i) : "");
		});
	}

	s = s.toString();
	if (base === undefined || base === 10) {
		s = expandExponential(s);
	}

	var parts = /^([-+]?)(0[xXbB]?)?([0-9A-Za-z]*)(?:\.\d*)?$/.exec(s);
	if (parts) {
		var sign = parts[1] || "+";
		var baseSection = parts[2] || "";
		var digits = parts[3] || "";

		if (base === undefined) {
			// Guess base
			if (baseSection === "0") { // Octal, or just 0
				if (digits.length === 0) {
					base = 10;
					digits = "0";
				}
				else {
					base = 8;
				}
			}
			else if (baseSection === "0x" || baseSection === "0X") { // Hex
				base = 16;
			}
			else if (baseSection === "0b" || baseSection === "0B") { // Binary
				base = 2;
			}
			else {
				base = 10;
			}
		}
		else if (base < 2 || base > 36) {
			throw new Error("Illegal radix " + base + ".");
		}

		// Check for digits outside the range
		if (!(new RegExp("^[" + BigInteger.digits.slice(0, base).join("") + "]*$", "i").test(digits))) {
			throw new Error("Bad digit for radix " + base);
		}

		// Strip leading zeros, and convert to array
		digits = digits.replace(/^0+/, "").split("");
		if (digits.length === 0) {
			return BigInteger.ZERO;
		}

		// Get the sign (we know it's not zero)
		sign = (sign === "-") ? -1 : 1;

		// Optimize base 10
		if (base == 10) {
			return new BigInteger(digits.map(Number).reverse(), sign);
		}

		// Do the conversion
		var d = BigInteger.ZERO;
		base = BigInteger(base);
		var small = BigInteger.small;
		for (var i = 0; i < digits.length; i++) {
			d = d.multiply(base).add(small[parseInt(digits[i], 36)]);
		}
		return new BigInteger(d._d, sign);
	}
	else {
		throw new Error("Invalid BigInteger format");
	}
};

BigInteger.prototype.add = function(n) {
	if (this._s === 0) {
		return BigInteger(n);
	}

	n = BigInteger(n);
	if (n._s === 0) {
		return this;
	}
	if (this._s !== n._s) {
		n = n.negate();
		return this.subtract(n);
	}

	var a = this._d;
	var b = n._d;
	var al = a.length;
	var bl = b.length;
	var sum = new Array(Math.max(al, bl) + 1);
	var size = Math.min(al, bl);
	var carry = 0;

	for (var i = 0; i < size; i++) {
		var digit = a[i] + b[i] + carry;
		sum[i] = digit % 10;
		carry = Math.floor(digit / 10);
	}
	if (bl > al) {
		a = b;
		al = bl;
	}
	for (var i = size; i < al; i++) {
		var digit = a[i] + carry;
		sum[i] = digit % 10;
		carry = Math.floor(digit / 10);
	}
	if (carry) {
		sum[i] = carry;
	}

	return new BigInteger(sum, this._s);
};

BigInteger.prototype.negate = function() {
	return new BigInteger(this._d, -this._s);
};

BigInteger.prototype.abs = function() {
	return (this._s < 0) ? this.negate() : this;
};

BigInteger.prototype.subtract = function(n) {
	if (this._s === 0) {
		return BigInteger(n).negate();
	}

	n = BigInteger(n);
	if (n._s === 0) {
		return this;
	}
	if (this._s !== n._s) {
		n = n.negate();
		return this.add(n);
	}

	var m = this;
	// negative - negative => -|a| - -|b| => -|a| + |b| => |b| - |a|
	if (this._s < 0) {
		var t = m;
		m = new BigInteger(n._d, 1);
		n = new BigInteger(t._d, 1);
	}

	// Both are positive => a - b
	var sign = m.compareAbs(n);
	if (sign === 0) {
		return BigInteger.ZERO;
	}
	else if (sign < 0) {
		// swap m and n
		var t = n;
		n = m;
		m = t;
	}

	// a > b
	var a = m._d;
	var b = n._d;
	var al = a.length;
	var bl = b.length;
	var diff = new Array(al); // al >= bl since a > b
	var borrow = 0;

	for (var i = 0; i < bl; i++) {
		var digit = a[i] - borrow - b[i];
		if (digit < 0) {
			digit += 10;
			borrow = 1;
		}
		else {
			borrow = 0;
		}
		diff[i] = digit;
	}
	for (var i = bl; i < al; i++) {
		var digit = a[i] - borrow;
		if (digit < 0) {
			digit += 10;
			borow = -1;
		}
		else {
			borrow = 0;
		}
		diff[i] = digit;
	}

	return new BigInteger(diff, sign);
};

BigInteger.prototype.compareAbs = function(n) {
	n = BigInteger(n);
	if (this._s === 0) {
		return (n._s !== 0) ? -1 : 0;
	}
	if (n._s === 0) {
		return 1;
	}

	var l = this._d.length;
	var nl = n._d.length;
	if (l < nl) {
		return -1;
	}
	else if (l > nl) {
		return 1;
	}

	var a = this._d;
	var b = n._d;
	for (var i = l-1; i >= 0; i--) {
		if (a[i] !== b[i]) {
			return a[i] < b[i] ? -1 : 1;
		}
	}

	return 0;
};

BigInteger.prototype.compare = function(n) {
	n = BigInteger(n);

	if (this._s === 0) {
		return -n._s;
	}

	if (this._s === n._s) { // both positive or both negative
		var cmp = this.compareAbs(n);
		return cmp * this._s;
	}
	else {
		return this._s < 0 ? -1 : 1;
	}
};

BigInteger.prototype.isUnit = function() {
	return this === BigInteger.ONE ||
		this === BigInteger.M_ONE ||
		(this._d.length === 1 && this._d[0] === 1);
};

// TODO: Consider adding Karatsuba multiplication for large numbers
BigInteger.prototype.multiply = function(n) {
	if (this._s === 0) {
		return BigInteger.ZERO;
	}

	n = BigInteger(n);
	if (n._s === 0) {
		return BigInteger.ZERO;
	}
	if (this.isUnit()) {
		if (this._s < 0) {
			return n.negate();
		}
		return n;
	}
	if (n.isUnit()) {
		if (n._s < 0) {
			return this.negate();
		}
		return this;
	}

	var r = (this._d.length >= n._d.length);
	var a = (r ? this : n)._d; // a will be longer than b
	var b = (r ? n : this)._d;
	var al = a.length;
	var bl = b.length;

	var pl = al + bl;
	var partial = new Array(pl);
	for (var i = 0; i < pl; i++) {
		partial[i] = 0;
	}

	for (var i = 0; i < bl; i++) {
		var carry = 0;
		for (var j = 0; j < al; j++) {
			var digit = b[i] * a[j] + carry;
			partial[i+j] += digit;
			carry = Math.floor(partial[i+j] / 10);
			partial[i+j] = partial[i+j] % 10;
		}
		if (carry) {
			partial[i+j] += carry;
			carry = Math.floor(partial[i+j] / 10);
			partial[i+j] = partial[i+j] % 10;
		}
	}
	if (carry) partial.push(carry);
	return new BigInteger(partial, this._s !== n._s ? -1 : 1);
};

BigInteger.prototype.square = function() {
	return this.multiply(this);
};

BigInteger.prototype.divide = function(n) {
	return this.divMod(n)[0];
};

BigInteger.prototype.mod = function(n) {
	return this.divMod(n)[1];
};

BigInteger.prototype.divMod = function(n) {
	n = BigInteger(n);
	if (n._s === 0) {
		throw new Error("Divide by zero");
	}

	if (this._s === 0) {
		return [BigInteger.ZERO, BigInteger.ZERO];
	}
	if (n.isUnit()) {
		return [n._s > 0 ? this : this.negate(), BigInteger.ZERO];
	}

	// Test for easy cases -- |n1| <= |n2|
	switch (this.compareAbs(n)) {
	case 0: // n1 == n2
		return [this._s === n._s ? BigInteger.ONE : BigInteger.M_ONE, BigInteger.ZERO];
	case -1: // |n1| < |n2|
		return [BigInteger.ZERO, this];
	}

	function getMostSignificantDigits(n, digits) {
		return new BigInteger(n._d.slice(n._d.length - digits), 1);
	}

	function getLeastSignificantDigitsArray(n, allBut) {
		return n._d.slice(0, n._d.length - allBut);
	}

	function msd(n, count) {
		return new BigInteger(n._d.slice(n._d.length - count), 1);
	}

	var sign = this._s === n._s ? 1 : -1;
	var a = n.abs();
	var b = this.abs();
	var b_digits = b._d.slice();
	var digits = a._d.length;
	var max = b._d.length;
	var quot = [];
	var msda = msd(a, 1);
	var tries = 1;
	var dd = digits;
	var small = BigInteger.small;

//trace && print("dividing:", b);
//trace && print("by:      ", a);

	var part = new BigInteger([], 1);
	part._s = 1;

	for (var i = digits; b_digits.length; i++) {
		part._d.unshift(b_digits.pop());
		part = new BigInteger(part._d, 1);
//trace && print("guessing from", part);
//trace && print("    compare ^ to ", a);
		if (part.compareAbs(a) < 0) {
//trace && print("        smaller, get more of the number");
//trace && print("*** adding digit:", 0);
			quot.push(0);
			tries++;
			continue;
		}
		if (part._s === 0) {
			guess = 0;
		}
		else {
			var guess = 9;
		}
		do {
			var check = a.multiply(small[guess]);
			if (check.compareAbs(part) <= 0) {
				break;
			}
			guess--;
		} while (guess);
//trace && print("guess:", guess);
//trace && print("multiply:", a, "*", guess, "=", check);
//trace && print("*** adding digit:", guess);
		quot.push(guess);
		if (!guess) continue;
		var diff = part.subtract(check);
//trace && print("subtract:", diff);
		part._d = diff._d.slice();
//trace && print("bring down:", b_digits.length ? b_digits[b_digits.length - 1] : "nothing left");
		tries = 1;
		i = digits - 1;
	}

	return [new BigInteger(quot.reverse(), sign), new BigInteger(part._d, this._s)];
};

BigInteger.prototype.isEven = function() {
	var digits = this._d;
	return digits.length === 0 || (digits[0] % 2) === 0
};

BigInteger.prototype.isOdd = function() {
	return !this.isEven();
};

BigInteger.prototype.isPositive = function() {
	return this._s > 0;
};

BigInteger.prototype.isNegative = function() {
	return this._s < 0;
};

BigInteger.prototype.isZero = function() {
	return this._s === 0;
};


// 0**0 == 1
BigInteger.prototype.pow = function(n) {
	if (this.isUnit()) {
		if (this._s > 0) return this;
		else return BigInteger(n).isOdd() ? this : this.negate();
	}

	n = BigInteger(n);
	if (n._s === 0) {
		return BigInteger.ONE;
	}
	if (this._s === 0 || n._s < 0) {
		return BigInteger.ZERO;
	}
	if (n.isUnit()) {
		return this;
	}

	if (n.compareAbs(BigInteger.MAX_EXP) > 0) {
		throw new Error("exponent too large in BigInteger.pow");
	}
	var x = this;
	var aux = BigInteger.ONE;
	var two = BigInteger.small[2];

	while (n.isPositive()) {
		if (n.isOdd()) {
			aux = aux.multiply(x);
			if (n.isUnit()) {
				return aux;
			}
		}
		x = x.square();
		n = n.divide(two);
    }

    return aux;
};

BigInteger.MAX_EXP = BigInteger(0x7FFFFFFF);

BigInteger.prototype.modPow = function(exponent, modulus) {
	var TWO = BigInteger.small[2];
	var result = BigInteger.ONE;
	var base = this;

	while (exponent.isPositive()) {
		if (exponent.isOdd()) {
			result = result.multiply(base).mod(modulus);
		}

		exponent = exponent.divide(TWO);
		base = base.square().mod(modulus);
	}

	return result;
};

BigInteger.prototype.toJSValue = function() {
	return parseInt(this.toString(), 10);
};

(function() {
	function makeUnary(fn) {
		return function(a) {
			return fn.call(BigInteger(a));
		}
	}

	function makeBinary(fn) {
		return function(a, b) {
			return fn.call(BigInteger(a), BigInteger(b));
		}
	}

	function makeTrinary(fn) {
		return function(a, b, c) {
			return fn.call(BigInteger(a), BigInteger(b), BigInteger(c));
		}
	}

	(function() {
		var unary = "toJSValue,isEven,isOdd,isZero,isNegative,abs,isUnit,square,negate,isPositive,toString".split(",");
		var binary = "compare,mod,divMod,subtract,add,divide,multiply,pow,compareAbs".split(",");
		var trinary = ["modPow"];

		for (var i = 0; i < unary.length; i++) {
			var fn = unary[i];
			BigInteger[fn] = makeUnary(BigInteger.prototype[fn]);
		}

		for (var i = 0; i < binary.length; i++) {
			var fn = binary[i];
			BigInteger[fn] = makeBinary(BigInteger.prototype[fn]);
		}

		for (var i = 0; i < trinary.length; i++) {
			var fn = trinary[i];
			BigInteger[fn] = makeTrinary(BigInteger.prototype[fn]);
		}
	})();
})();