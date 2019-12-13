CREATE TABLE [dbo].[SchemaInformation] (
    [Id]           BIGINT         IDENTITY (1, 1) NOT NULL,
    [SchemaInfo]   NVARCHAR (MAX) NULL,
    [CreationDate] DATETIME       NULL,
    CONSTRAINT [PK_SchemInfo] PRIMARY KEY CLUSTERED ([Id] ASC)
);

