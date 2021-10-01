const fs = require('fs');

fs.readFile('data/ceps.txt', 'UTF-8', (err, data) => {
    let cidadesCeps = {},
        ibgeCeps = {},
        cidadesIbge = {};

    data.split('\n').forEach(element => {
        let cep = new Cep(element),
            cepToInsert = cidadesCeps[String(cep)]
                ? cidadesCeps[String(cep)].updateCep(cep)
                : cep;

        cidadesCeps[String(cepToInsert)] = cepToInsert;
    });

    fs.readFile('data/ibge.json', 'UTF-8', (err, dataJson) => {
        let allCitiesData = JSON.parse(dataJson);

        allCitiesData.data.forEach(element => {
            let ibge = new Ibge(element),
                ceps = cidadesCeps[String(ibge)];

            cidadesIbge[String(ibge)] = ibge;

            if (!ceps) {
                console.log(`Cidade ${String(ibge)} não encontrada na base de ceps.`);
                return true;
            }

            ibgeCeps[String(ibge)] = ibge.updateCep(ceps);
        });

        fs.writeFile('finalResult.json', JSON.stringify(Object.values(ibgeCeps), null, 4), err => {
            if (err) {
                console.error(err)
            }
            console.log("Success!")
        });

        fs.writeFile('processedPostCodes.json', JSON.stringify(cidadesCeps, null, 4), err => {
            if (err) {
                console.error(err)
            }
            console.log("Success!")
        });
        fs.writeFile('processedCityCodes.json', JSON.stringify(cidadesIbge, null, 4), err => {
            if (err) {
                console.error(err)
            }
            console.log("Success!")
        });

    });
});

class Cep {
    nome = '';
    estado = '';
    cep = '';
    ceps = [];

    constructor(linha) {
        let colunas = linha.split('\t');
        if (colunas.length < 2) {
            return this;
        }

        let [nome, estado] = colunas[1].split('\/');

        if (nome.includes('(')) {
            nome = nome.split('(').pop().replace(/\)/g, '')
        }

        this.cep = Number(colunas[0]);
        this.nome = nome;
        this.estado = estado.substr(0, 2);
        this.ceps.push(this.cep);
        this.updateCep(this);
    }

    toString() {
        return `${this.estado}_${this.nome}`.replace(/[^a-zA-Z_]/gi, '').toLowerCase();
    }

    updateCep(cep) {
        this.ceps.push(cep.cep);
        let cepMin = this.ceps.reduce((a, b) => Math.min(a, b)),
            cepMax = this.ceps.reduce((a, b) => Math.max(a, b));

        this.ceps = [cepMin, cepMax];
    }
}

class Ibge {
    Id = '';
    Codigo = '';
    Nome = '';
    Uf = '';
    ceps = [];

    constructor(obj) {
        Object.assign(this, obj);
    }

    toString() {
        return `${this.Uf}_${this.Nome}`.replace(/[^a-zA-Z_]/gi, '').toLowerCase();
    }

    updateCep(cep) {
        this.ceps = cep.ceps;
        return this;
    }

    toJSON() {
        let cepMin = this.ceps.reduce((a, b) => Math.min(a, b)),
            cepMax = this.ceps.reduce((a, b) => Math.max(a, b));

        return {
            codigo: this.Codigo,
            nome: this.Nome,
            uf: this.Uf,
            ceps: { cepMin, cepMax },
        }
    }
}