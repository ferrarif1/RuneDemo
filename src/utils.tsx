// 协议消息中的第一个数据推送被解码为序列整数。这些整数被解释为 (ID, OUTPUT, AMOUNT) 元组序列。整数被编码为前缀 varint，其中 varint 中前导的数量决定了其字节长度。
// 前缀变体有很多种类型，这里是比特币风格

// 为了发行 21000000 个符文，我们使用这个元组[0 , 1, 21000000].

// 元组中的第一个整数是0  ----  发行交易的ID

// 元组中的第二个整数映射到1 ---- 交易的输出索引

// 元组中的第三个整数是要发出的金额 ---- 21000000

//以下功能代码参考https://docs.runealpha.xyz/en/issuance-example

// import { bb26 } from 'base26';
// detail rose mosquito army route blind fog error danger organ sense flower
//********Part 1 比特币风格编码***********/

//示例：
// 0 => 00
// 1 => 01
// 21000000 => fe406f4001

// [0, 1, 21000000] => 0001fe406f4001
export function encodeBitcoinVarInt(value: number) {
  if (value < 0xfd) {
    return [value]
  } else if (value <= 0xffff) {
    return [0xfd, value & 0xff, (value >> 8) & 0xff]
  } else if (value <= 0xffffffff) {
    return [
      0xfe,
      value & 0xff,
      (value >> 8) & 0xff,
      (value >> 16) & 0xff,
      (value >> 24) & 0xff,
    ]
  } else {
    return [
      0xff,
      value & 0xff,
      (value >> 8) & 0xff,
      (value >> 16) & 0xff,
      (value >> 24) & 0xff,
      (value >> 32) & 0xff,
      (value >> 40) & 0xff,
      (value >> 48) & 0xff,
      (value >> 56) & 0xff,
    ]
  }
}

//调用的时候用这个直接编码元祖
export function encodeBitcoinVarIntTuple(tuple: any[]) {
  const encodedBytes = tuple.map(encodeBitcoinVarInt).flat()

  // Convert the bytes to a hexadecimal string
  const hexString = encodedBytes
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')

  return hexString
}

//********Part 2  base-26 编码***********/
// 计算协议消息中的第一个数据。第二个数据推送被解码为两个整数，SYMBOL和DECIMALS。SYMBOL是一个基于26进制编码的人类可读符号，
// 类似于用于序数名称的编码。有效字符仅限于A至Z。序数名称是序数数字的修改过的基于26进制编码。为了避免在无法消费的创世区块的coinbase奖励中锁定短名称，
// 序数名称会随着序数数字的增长而变短。例如，第一个被挖出的satoshi（序数0）的名称是nvtdijuwxlp，而最后一个被挖出的satoshi（序数2,099,999,997,689,999）的名称是a。
// 这里要npm install bb26
function from(alpha: string): number {
  if (!/^[a-z]+$/.test(alpha)) {
    throw new Error(
      'Input must be a non-empty string comprised of only characters a-z',
    )
  }

  const letters = alpha.split('')
  let out = 0

  for (let i = 0; i < letters.length; i++) {
    out +=
      (letters[letters.length - 1 - i].charCodeAt(0) - 96) * Math.pow(26, i)
  }

  return out
}

function to(decimal: number): string {
  if (decimal <= 0) {
    throw new Error('Number must be > 0')
  }

  let out = ''

  while (true) {
    out = String.fromCharCode(((decimal - 1) % 26) + 97) + out
    decimal = Math.floor((decimal - 1) / 26)

    if (decimal === 0) {
      break
    }
  }

  return out
}

export function bb26Encode(text: string): number {
  const result = (2099999997689999 + 1 - from(text));
  return result;
}


export function decimalToHexString(num: number): string {
  return num.toString(16)
}

//********Part 3 拼接OP_return***********/
//Last result  of Protocol message
//OP_RETURN 52 0001fe406f4001 ffdbf3de59dbf3de5912
//"52"在十进制中等于82, 82是“R”在utf-8编码的数值，代表主网

export {}
