export default async function scraper() {
  const output = await Deno.open("./data/protein-sequences.fasta", {
    write: true,
    create: true,
    append: true
  })
  
  const logger = output.writable.getWriter()

  const encoder = new TextEncoder()

  const multiples = await Deno.open('./data/multiples.tsv', {
    write: true,
    create: true,
    append: true
  })

  const multiples_logger = multiples.writable.getWriter()

  const txt = await Deno.readTextFile('./gene-uniprot-ids-27.tsv')
  const gene_to_protein = txt.split('\n')
    .filter(Boolean)
    .map(line => line
      .split('\t')
      .map((e, i) => i === 1 ? e.split(',') : e)
    )

  const gene_to_protein_list = Object.fromEntries(gene_to_protein)

  for (const gene of Object.keys(gene_to_protein_list)) {
    for (const protein_list of gene_to_protein_list[gene]) {
      let proteins = []
      for (const protein of protein_list.split(',')) {
        try {
          const url = `https://rest.uniprot.org/uniprotkb/${protein}`;
          const response = await fetch(url);
          const data = await response.json();

          const sequence = data.sequence.value
          const length = data.sequence.length
          const score = data.annotationScore

          proteins.push({protein, sequence, length, score})
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      }
      const exemplar = proteins.sort((a, b) => b.score - a.score)[0]
      const {protein, sequence, length, score} = exemplar
      const header = `>${gene} ${protein} ${length} ${score}`
      await logger.write(encoder.encode(`${header}\n${sequence}\n`))
      console.log(header, sequence)

      const multiple_exemplars = proteins.filter(p => p.score === exemplar.score)

      if (multiple_exemplars.length > 1) {
        const row = `${gene}\t${exemplar.score}\t${multiple_exemplars.map(p => p.protein).join(',')}\t${multiple_exemplars.map(p => p.sequence).join(',')}`
        await multiples_logger.write(encoder.encode(`${row}\n`))
        console.log(row)
      }
    }
  }

  await logger.close()
}