import { parse } from "@retorquere/bibtex-parser";
import { describe, expect, it } from "vitest";
import { loadPublicationsFromBibFile, publicationFromBibEntry } from "./bib-publications";

describe("publications.bib author parsing", () => {
  it("parses and-separated First Last names correctly", () => {
    const parsed = parse(
      "@inproceedings{x, author={Biao Yi and Xueyu Hu and Yurun Chen and Shengyu Zhang}, title={T}, year={2026}}",
    );
    const item = publicationFromBibEntry(parsed.entries[0]!);
    expect(item.authors).toContain("Shengyu Zhang");
    expect(item.authors).toContain("Yurun Chen");
    expect(item.authors).toContain("Biao Yi");
  });

  it("builds an ordered authorList alongside the joined string", () => {
    const parsed = parse(
      "@inproceedings{x, author={Yurun Chen and Shengyu Zhang}, title={T}, year={2026}}",
    );
    const item = publicationFromBibEntry(parsed.entries[0]!);
    expect(item.authorList).toEqual(["Yurun Chen", "Shengyu Zhang"]);
  });

  it("turns a blog field into an internal Blog link + blogHref", () => {
    const parsed = parse(
      "@inproceedings{x, title={T}, author={A User}, year={2026}, blog={graph2eval-cvpr-2026}}",
    );
    const item = publicationFromBibEntry(parsed.entries[0]!);
    expect(item.blogHref).toBe("/blog/graph2eval-cvpr-2026");
    const blogLink = item.links.find((link) => link.label === "Blog");
    expect(blogLink?.href).toBe("/blog/graph2eval-cvpr-2026");
    expect(blogLink?.external).toBe(false);
  });

  it("parses + dedupes topics from keywords and serializes copy-ready BibTeX", () => {
    const parsed = parse(
      "@inproceedings{x, title={T}, author={A B and C D}, year={2026}, booktitle={CVPR}, keywords={Agents, RAG, Agents}}",
    );
    const item = publicationFromBibEntry(parsed.entries[0]!);
    expect(item.topics).toEqual(["Agents", "RAG"]);
    expect(item.bibtex).toContain("@inproceedings{x,");
    expect(item.bibtex).toContain("author = {A B and C D}");
    expect(item.bibtex).toContain("year = {2026}");
  });

  it("reads presentation honor from BibTeX metadata", () => {
    const parsed = parse(
      "@inproceedings{x, title={T}, author={A User}, year={2026}, booktitle={CVPR}, honor={oral}}",
    );
    const item = publicationFromBibEntry(parsed.entries[0]!);
    expect(item.venue).toBe("CVPR 2026");
    expect(item.honor).toBe("Oral");
  });

  it("loads ecoagent with all authors from publications.bib", () => {
    const pubs = loadPublicationsFromBibFile("content/publications.bib");
    const eco = pubs.find((p) => p.id === "ecoagentefficientdevicecloud2026");
    expect(eco?.authors).toContain("Shengyu Zhang");
    expect(eco?.authors).toContain("Yurun Chen");
    expect(eco?.authors).toContain("Fan Wu");
  });
});
