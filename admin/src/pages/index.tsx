import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  createStyles,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  makeStyles,
  TextField,
  Theme,
  Typography,
} from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import FolderIcon from "@material-ui/icons/Folder";
import DescriptionIcon from "@material-ui/icons/Description";
import Link from "next/link";

import React from "react";
import { gql, useMutation, useQuery } from "@apollo/client";
import { useRouter } from "next/router";

import Layout, { Page } from "../components/Layout";
import { Alert } from "@material-ui/lab";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    titleHighlight: {
      color: theme.palette.secondary.main,
    },
    subtitle: {
      fontSize: "1.6rem",
      width: "60%",
      lineHeight: 2,
      marginBottom: theme.spacing(5),
    },
    projectName: {
      marginTop: -6,
      marginRight: theme.spacing(2),
    },
    button: {
      marginRight: theme.spacing(2),
    },
  })
);

const CURRENT_PROJECT = gql`
  query CurrentProject {
    currentProject {
      name
    }
  }
`;

const OPEN_PROJECT = gql`
  mutation OpenProject($name: String!) {
    openProject(name: $name) {
      name
    }
  }
`;

function Index(): JSX.Element {
  const classes = useStyles();
  const router = useRouter();
  const [input, setInput] = React.useState(null);
  const { error: curProjErr, data: curProjData } = useQuery(CURRENT_PROJECT, {
    pollInterval: 1000,
  });
  const [
    openProject,
    { error: openProjErr, data: openProjData, loading: openProjLoading },
  ] = useMutation(OPEN_PROJECT, {
    errorPolicy: "all",
    onCompleted({ openProject }) {
      if (openProject) {
        router.push("/projects/get-started");
      }
    },
    update(cache, { data: { openProject } }) {
      cache.modify({
        fields: {
          currentProject() {
            const curProjRef = cache.writeFragment({
              id: openProject.name,
              data: openProject,
              fragment: gql`
                fragment OpenProject on Project {
                  name
                  type
                }
              `,
            });
            return curProjRef;
          },
        },
      });
    },
  });

  const handleForm = (e: React.SyntheticEvent) => {
    e.preventDefault();
    openProject({ variables: { name: input.value } });
  };

  if (curProjErr) {
    return (
      <Layout page={Page.Home} title="">
        <Alert severity="error">
          Error fetching current project: {curProjErr.message}
        </Alert>
      </Layout>
    );
  }

  return (
    <Layout page={Page.Home} title="">
      <Box p={4}>
        <Box mb={4} width="60%">
          <Typography variant="h2">
            <span className={classes.titleHighlight}>Hetty://</span>
            <br />
            The simple HTTP toolkit for security research.
          </Typography>
        </Box>

        <Typography className={classes.subtitle} paragraph>
          What if security testing was intuitive, powerful, and good looking?
          What if it was <strong>free</strong>, instead of $400 per year?{" "}
          <span className={classes.titleHighlight}>Hetty</span> is listening on{" "}
          <code>:8080</code>…
        </Typography>

        {curProjData?.currentProject?.name ? (
          <div>
            <Box mb={1}>
              <Typography variant="h6">Current project:</Typography>
            </Box>
            <Box ml={-2} mb={4}>
              <List>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <DescriptionIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={curProjData.currentProject.name} />
                </ListItem>
              </List>
            </Box>
            <Link href="/projects" passHref>
              <Button
                className={classes.button}
                variant="outlined"
                component="a"
                size="large"
                startIcon={<FolderIcon />}
              >
                Manage projects
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleForm} autoComplete="off">
            <TextField
              className={classes.projectName}
              color="secondary"
              inputProps={{
                id: "projectName",
                ref: (node) => {
                  setInput(node);
                },
              }}
              label="Project name"
              placeholder="Project name…"
              error={Boolean(openProjErr)}
              helperText={openProjErr && openProjErr.message}
            />
            <Button
              className={classes.button}
              type="submit"
              variant="contained"
              color="secondary"
              size="large"
              disabled={
                openProjLoading || Boolean(openProjData?.openProject?.name)
              }
              startIcon={
                openProjLoading || openProjData?.openProject ? (
                  <CircularProgress size={22} />
                ) : (
                  <AddIcon />
                )
              }
            >
              Create project
            </Button>
            <Link href="/projects" passHref>
              <Button
                className={classes.button}
                variant="outlined"
                component="a"
                size="large"
                startIcon={<FolderIcon />}
              >
                Open project…
              </Button>
            </Link>
          </form>
        )}
      </Box>
    </Layout>
  );
}

export default Index;
