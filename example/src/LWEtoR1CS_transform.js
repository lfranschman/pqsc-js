const math = require('mathjs');

const n = 4;

function LWEToR1CS_transform() {
    const num_gates = n * n * 2;
    const num_variables = n * n + 2 * n + num_gates + 1;

    // Initialize matrices with zeros
    const A_matrix = math.zeros(num_gates, num_variables).toArray();
    const B_matrix = math.zeros(num_gates, num_variables).toArray();
    const C_matrix = math.zeros(num_gates, num_variables).toArray();

    // Format will be: {1, t0-tn (n), A00 - Ann(n^2), s0 - sn(n), e0 - en(n), gates a0 - an^2 (n^2), gates c0-c n^2 - n (n^2 - n)}
    // Processing gates a0 - an^2
    for (let i = 0; i < n * n; i++) {
        A_matrix[i][i + n + 1] = 1;
        B_matrix[i][1 + n + n * n + (i % n)] = 1;
        C_matrix[i][1 + 3 * n + n * n + i] = 1;
    }

    // Processing gates c0-cn^2 and outputs/t
    let c = 0, d = 0, z = 0, p = 0;
    for (let i = 0; i < n * n; i++) {
        B_matrix[n * n + i][0] = 1;
        if ((i % n) === 0) {
            A_matrix[n * n + i][1 + 3 * n + i + n * n] = 1;
            A_matrix[n * n + i][1 + 3 * n + n * n + i + 1] = 1;
            C_matrix[n * n + i][1 + 3 * n + z + 2 * n * n] = 1;
            z += 1;
        } else if ((i + 1) % n !== 0) {
            A_matrix[n * n + i][1 + 3 * n + i + n * n + 1] = 1;
            A_matrix[n * n + i][1 + 3 * n + c + 2 * n * n] = 1;
            C_matrix[n * n + i][1 + 3 * n + z + 2 * n * n] = 1;
            c += 1;
            z += 1;
        } else {
            if (1 + 3 * n + c + 2 * n * n < num_variables) {
                A_matrix[n * n + i][1 + 3 * n + c + 2 * n * n] = 1;
                A_matrix[n * n + i][1 + 2 * n + n * n + d] = 1;
                C_matrix[n * n + i][1 + p] = 1;
                c += 1;
                d += 1;
                p += 1;
            }
        }
    }

    return { A_matrix, B_matrix, C_matrix };
}

module.exports = { LWEToR1CS_transform  };

// Example usage
//const { A_matrix, B_matrix, C_matrix } = LWEToR1CS_transform();

//console.log('A_matrix:', A_matrix);
//console.log('B_matrix:', B_matrix);
//console.log('C_matrix:', C_matrix);

