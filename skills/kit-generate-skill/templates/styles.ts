import { StyleSheet } from "@react-pdf/renderer";

export const kitStyles = StyleSheet.create({
  page: {
    padding: 60,
    background: "#F6F3EE",
    fontFamily: "Helvetica",
    color: "#1A1814",
  },
  title: {
    fontSize: 22,
    marginBottom: 8,
    fontFamily: "Helvetica-Bold",
  },
  subtitle: {
    fontSize: 12,
    color: "#555",
    marginBottom: 20,
  },
  goldRule: {
    borderBottom: "1pt solid #B8902A",
    marginBottom: 16,
  },
  body: {
    fontSize: 11,
    lineHeight: 1.7,
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginTop: 16,
    marginBottom: 8,
    color: "#1A1814",
  },
  listItem: {
    fontSize: 11,
    lineHeight: 1.6,
    marginBottom: 6,
    paddingLeft: 12,
  },
  footer: {
    fontSize: 9,
    color: "#777",
    marginTop: 32,
    textAlign: "center",
  },
  previewBanner: {
    fontSize: 10,
    color: "#B8902A",
    marginBottom: 16,
    fontStyle: "italic",
    textAlign: "center",
  },
});